'use client';

import 'react-quill-new/dist/quill.snow.css'; // Import Quill styles
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

// Define minimal props interface locally since it's not exported correctly from the package
interface ReactQuillProps {
  theme?: string;
  modules?: any;
  formats?: string[];
  value?: string;
  onChange?: (value: string, delta: any, source: any, editor: any) => void;
  className?: string;
}

// Dynamically import ReactQuill to avoid SSR issues and provide correct types
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false }) as ComponentType<ReactQuillProps>;

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function QuillEditor({ value, onChange }: QuillEditorProps) {
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'image'],
      ['clean']
    ],
  };

  return (
    <div className="bg-white text-black rounded-lg h-full">
      <ReactQuill theme="snow" value={value} onChange={onChange} modules={modules} className="h-[calc(100%-42px)]" />
    </div>
  );
}
