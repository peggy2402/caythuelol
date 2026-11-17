import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { IBlog } from '../../database/schemas/Blog';
import { IComment } from '../../database/schemas/Comment';

@Injectable()
export class BlogsService {
  constructor(
    @InjectModel('Blog') private blogModel: Model<IBlog>,
    @InjectModel('Comment') private commentModel: Model<IComment>,
  ) {}

  async listBlogs(tag?: string, search?: string, page = 1, limit = 9) {
    const skip = (page - 1) * limit;
    const filter: any = { isPublished: true };

    if (
      tag &&
      tag.trim().toLowerCase() !== 'all' &&
      tag.trim().toLowerCase() !== 'tat-ca' &&
      tag.trim().toLowerCase() !== 'tất cả'
    ) {
      const cleanTag = tag.trim().toLowerCase();
      if (cleanTag === 'meta & guide' || cleanTag === 'cẩm nang meta' || cleanTag === 'meta' || cleanTag === 'guide') {
        const metaRegex = /(cẩm nang|meta|chiến thuật|hướng dẫn|guide|kinh nghiệm|line-up|giáo án)/i;
        filter.$or = [
          { tags: { $regex: metaRegex } },
          { title: { $regex: metaRegex } },
        ];
      } else if (cleanTag === 'esports' || cleanTag === 'tin tức esports' || cleanTag === 'tin tức') {
        const esportsRegex = /(esports|giải đấu|tin tức|lck|lpl|vcs|riot|chuyển nhượng)/i;
        filter.$or = [
          { tags: { $regex: esportsRegex } },
          { title: { $regex: esportsRegex } },
        ];
      } else if (cleanTag === 'system' || cleanTag === 'thông báo hệ thống' || cleanTag === 'hệ thống' || cleanTag === 'thông báo') {
        const systemRegex = /(hệ thống|thông báo|cập nhật|bảo trì|chính sách|system)/i;
        filter.$or = [
          { tags: { $regex: systemRegex } },
          { title: { $regex: systemRegex } },
        ];
      } else {
        const escaped = tag.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.tags = { $regex: new RegExp(escaped, 'i') };
      }
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const searchCondition = {
        $or: [
          { title: { $regex: searchRegex } },
          { excerpt: { $regex: searchRegex } },
          { tags: { $regex: searchRegex } },
        ],
      };
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, searchCondition];
        delete filter.$or;
      } else {
        filter.$or = searchCondition.$or;
      }
    }

    const [blogs, total] = await Promise.all([
      this.blogModel
        .find(filter)
        .populate('author', 'username profile.avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.blogModel.countDocuments(filter),
    ]);

    return {
      success: true,
      blogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async searchBlogs(q: string) {
    if (!q || q.trim() === '') return { success: true, blogs: [] };
    const blogs = await this.blogModel
      .find({
        isPublished: true,
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { tags: { $regex: q, $options: 'i' } },
        ],
      })
      .select('title slug thumbnail excerpt createdAt')
      .limit(5)
      .lean();

    return { success: true, blogs };
  }

  async popularBlogs() {
    const blogs = await this.blogModel
      .find({ isPublished: true })
      .select('title slug thumbnail views createdAt')
      .sort({ views: -1 })
      .limit(5)
      .lean();

    return { success: true, blogs };
  }

  async getBlogBySlug(slug: string) {
    const blog = await this.blogModel
      .findOneAndUpdate({ slug, isPublished: true }, { $inc: { views: 1 } }, { new: true })
      .populate('author', 'username profile.avatar')
      .lean();

    if (!blog) throw new NotFoundException('Không tìm thấy bài viết');
    return { success: true, blog };
  }

  async getComments(blogId: string) {
    const comments = await this.commentModel
      .find({ blogId: new Types.ObjectId(blogId) })
      .populate('userId', 'username profile.avatar')
      .sort({ createdAt: 1 })
      .lean();

    return { success: true, comments };
  }

  async createComment(blogId: string, userId: string, content: string, parentId?: string) {
    const comment = new this.commentModel({
      blogId: new Types.ObjectId(blogId),
      userId: new Types.ObjectId(userId),
      content,
      parentId: parentId ? new Types.ObjectId(parentId) : null,
    });
    await comment.save();
    const populated = await comment.populate('userId', 'username profile.avatar');
    return { success: true, comment: populated };
  }

  async likeComment(commentId: string, userId: string) {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) throw new NotFoundException('Bình luận không tồn tại');

    const uId = new Types.ObjectId(userId);
    const index = comment.likes?.findIndex((id) => id.toString() === userId);

    if (index !== undefined && index > -1) {
      comment.likes?.splice(index, 1);
    } else {
      if (!comment.likes) comment.likes = [];
      comment.likes.push(uId);
    }

    await comment.save();
    return { success: true, likesCount: comment.likes.length, isLiked: index === -1 };
  }
}

