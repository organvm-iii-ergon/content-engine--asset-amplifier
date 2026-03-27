import React, { useEffect, useState } from 'react';
import { contentService } from '../services/api.js';
import { ContentUnit, ApprovalStatus } from '@cronus/domain';

export default function ReviewQueue() {
  const [units, setUnits] = useState<ContentUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const brandId = "placeholder-brand-id"; // TODO: get from context

  useEffect(() => {
    contentService.list(brandId, { approval_status: ApprovalStatus.pending })
      .then(setUnits)
      .finally(() => setLoading(false));
  }, [brandId]);

  const handleApprove = async (id: string) => {
    await contentService.approve(brandId, id);
    setUnits(prev => prev.filter(u => u.id !== id));
  };

  const handleReject = async (id: string) => {
    await contentService.reject(brandId, id);
    setUnits(prev => prev.filter(u => u.id !== id));
  };

  if (loading) return <div className="animate-pulse text-gray-500 text-base">Loading pending content...</div>;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Review Queue</h2>
          <p className="text-gray-500 mt-1 text-sm md:text-base">Approve or reject AI-generated posts for your brand.</p>
        </div>
        <div className="self-start text-sm font-medium bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full min-h-[36px] flex items-center">
          {units.length} Pending Units
        </div>
      </div>

      {units.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-8 md:p-12 text-center">
          <p className="text-gray-500 text-base">All caught up! No content pending review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {units.map(unit => (
            <div key={unit.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm active:shadow-md md:hover:shadow-md transition-shadow">
              {/* Media Preview */}
              <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Media Preview</span>
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2.5 py-1.5 rounded text-xs font-bold uppercase min-h-[32px] flex items-center">
                  {unit.platform}
                </div>
              </div>

              {/* Content */}
              <div className="p-4 md:p-5 space-y-4">
                {/* NC Score badge -- larger touch target */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-h-[44px]">
                    <span className="text-sm font-semibold text-gray-400">NC Score:</span>
                    <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${
                      unit.nc_score > 0.8
                        ? 'text-green-700 bg-green-50'
                        : 'text-amber-700 bg-amber-50'
                    }`}>
                      {(unit.nc_score * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Caption: minimum 16px (text-base) */}
                <p className="text-base text-gray-800 line-clamp-4 leading-relaxed">
                  {unit.caption}
                </p>

                {/* Hashtags */}
                <div className="flex flex-wrap gap-1.5">
                  {(unit.hashtags as string[] || []).map(tag => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Action buttons: full width, 44px min height, active states */}
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 pt-2">
                  <button
                    onClick={() => handleApprove(unit.id)}
                    className="flex-1 bg-black text-white text-sm font-bold py-3 sm:py-2 rounded-lg active:bg-gray-700 md:hover:bg-gray-800 transition-colors min-h-[44px]"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(unit.id)}
                    className="flex-1 bg-white border border-gray-200 text-gray-700 text-sm font-bold py-3 sm:py-2 rounded-lg active:bg-gray-100 md:hover:bg-gray-50 transition-colors min-h-[44px]"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
