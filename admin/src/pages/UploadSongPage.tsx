import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { songsAPI, artistsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Upload, Music } from 'lucide-react';

const schema = z.object({
  title: z.string().min(1),
  artist_id: z.string().uuid('Select an artist'),
  genre_id: z.string().optional(),
  language: z.string().optional(),
  duration_seconds: z.number().min(1),
  track_number: z.number().optional(),
  lyrics: z.string().optional(),
  is_downloadable: z.boolean().default(true),
  is_premium: z.boolean().default(false),
});

type FormData = z.infer<typeof schema>;

export default function UploadSongPage() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_downloadable: true, is_premium: false },
  });

  const { data: artists } = useQuery({
    queryKey: ['artists-all'],
    queryFn: () => artistsAPI.list({ limit: 100 }).then((r) => r.data.data),
  });

  const onSubmit = async (data: FormData) => {
    if (!audioFile) { toast.error('Audio file required'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => { if (v !== undefined) formData.append(k, String(v)); });
      formData.append('audio', audioFile);
      if (coverFile) formData.append('cover', coverFile);
      await songsAPI.create(formData);
      toast.success('Song uploaded successfully!');
      reset();
      setAudioFile(null);
      setCoverFile(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Upload Song</h1>
        <p className="text-gray-400 text-sm mt-1">Add a new song to the library</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Audio File Upload */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">Audio File *</label>
          <label className={`flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${audioFile ? 'border-green-500 bg-green-500/10' : 'border-gray-700 hover:border-gray-500 bg-gray-900'}`}>
            <Music className="h-8 w-8 text-gray-500 mb-2" />
            <span className="text-gray-400 text-sm">{audioFile ? audioFile.name : 'Click to upload MP3, FLAC, AAC, WAV'}</span>
            <input type="file" className="hidden" accept="audio/*" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} />
          </label>
        </div>

        {/* Cover Image */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">Cover Image</label>
          <label className={`flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${coverFile ? 'border-green-500 bg-green-500/10' : 'border-gray-700 hover:border-gray-500 bg-gray-900'}`}>
            <Upload className="h-6 w-6 text-gray-500 mb-1" />
            <span className="text-gray-400 text-sm">{coverFile ? coverFile.name : 'Upload cover image (JPG, PNG, WebP)'}</span>
            <input type="file" className="hidden" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
          </label>
        </div>

        {/* Title */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">Song Title *</label>
          <input {...register('title')} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500" placeholder="Enter song title" />
          {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
        </div>

        {/* Artist */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">Artist *</label>
          <select {...register('artist_id')} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500">
            <option value="">Select artist</option>
            {artists?.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          {errors.artist_id && <p className="text-red-400 text-xs mt-1">{errors.artist_id.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Duration (seconds) *</label>
            <input {...register('duration_seconds', { valueAsNumber: true })} type="number" className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500" placeholder="e.g. 213" />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Language</label>
            <input {...register('language')} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500" placeholder="e.g. English" />
          </div>
        </div>

        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">Lyrics</label>
          <textarea {...register('lyrics')} rows={5} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500" placeholder="Paste lyrics here..." />
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input {...register('is_downloadable')} type="checkbox" className="accent-green-500 h-4 w-4" />
            <span className="text-gray-300 text-sm">Downloadable</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input {...register('is_premium')} type="checkbox" className="accent-green-500 h-4 w-4" />
            <span className="text-gray-300 text-sm">Premium only</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {uploading ? (
            <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />Uploading...</>
          ) : (
            <><Upload className="h-4 w-4" />Upload Song</>
          )}
        </button>
      </form>
    </div>
  );
}

