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

  if (loading) return <div className="animate-pulse text-gray-500">Loading pending content...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Review Queue</h2>
          <p className="text-gray-500 mt-1">Approve or reject AI-generated posts for your brand.</p>
        </div>
        <div className="text-sm font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
          {units.length} Pending Units
        </div>
      </div>

      {units.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
          <p className="text-gray-500">All caught up! No content pending review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {units.map(unit => (
            <div key={unit.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Media Preview */}
              <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Media Preview</span>
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold uppercase">
                  {unit.platform}
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-gray-400">NC Score:</span>
                    <span className={`text-xs font-bold ${unit.nc_score > 0.8 ? 'text-green-600' : 'text-amber-600'}`}>
                      {(unit.nc_score * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-800 line-clamp-4 leading-relaxed">
                  {unit.caption}
                </p>

                <div className="flex flex-wrap gap-1">
                  {(unit.hashtags as string[] || []).map(tag => (
                    <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button 
                    onClick={() => handleApprove(unit.id)}
                    className="flex-1 bg-black text-white text-xs font-bold py-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleReject(unit.id)}
                    className="flex-1 bg-white border border-gray-200 text-gray-700 text-xs font-bold py-2 rounded-lg hover:bg-gray-50 transition-colors"
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
