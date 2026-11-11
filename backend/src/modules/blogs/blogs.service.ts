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

    if (tag) {
      filter.tags = tag;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
      ];
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

