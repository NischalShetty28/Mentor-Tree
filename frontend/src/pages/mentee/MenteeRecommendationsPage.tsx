import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, MessageSquare, Send, Clock, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../api/client';
import { Recommendation } from '../../types';

export const MenteeRecommendationsPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  // Acknowledgment modal
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [ackNote, setAckNote] = useState('');
  const [ackLoading, setAckLoading] = useState(false);

  // Comment input state
  const [commentText, setCommentText] = useState<{ [recId: string]: string }>({});
  const [commentLoading, setCommentLoading] = useState<{ [recId: string]: boolean }>({});

  const fetchRecs = async () => {
    try {
      setLoading(true);
      const data = await api.getMenteeRecommendations();
      setRecommendations(data);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecs();
  }, []);

  const handleAcknowledge = async () => {
    if (!selectedRec) return;
    try {
      setAckLoading(true);
      await api.acknowledgeRecommendation(selectedRec.id, ackNote);
      await fetchRecs();
      setSelectedRec(null);
      setAckNote('');
    } catch (err: any) {
      alert(err.message || 'Failed to acknowledge recommendation');
    } finally {
      setAckLoading(false);
    }
  };

  const handleAddComment = async (recId: string) => {
    const text = commentText[recId]?.trim();
    if (!text) return;

    try {
      setCommentLoading({ ...commentLoading, [recId]: true });
      await api.addRecommendationComment(recId, text);
      setCommentText({ ...commentText, [recId]: '' });
      await fetchRecs();
    } catch (err: any) {
      alert(err.message || 'Failed to post comment');
    } finally {
      setCommentLoading({ ...commentLoading, [recId]: false });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Mentor Recommendations & Notes
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Actionable guidance shared by your faculty mentor. Review, acknowledge, and discuss your progress.
        </p>
      </div>

      {recommendations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-slate-500 space-y-2">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">No Recommendations Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Your faculty mentor has not added any recommendations yet. Attend your next mentoring session to formulate goals.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <Card key={rec.id} className="overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                      {rec.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{rec.title}</h3>
                  </div>
                  <div>
                    {rec.isAcknowledged ? (
                      <Badge variant="success" size="sm">
                        ✓ Acknowledged
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setSelectedRec(rec)}
                        leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                      >
                        Acknowledge Recommendation
                      </Button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50/60 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
                  {rec.description}
                </p>

                {/* Mentor attribution & acknowledgment metadata */}
                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />
                    <span>Recommended by {rec.mentor?.fullName} ({rec.mentor?.designation})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Issued {new Date(rec.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {rec.acknowledgmentNote && (
                  <div className="text-xs bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                    <span className="font-bold">Your Acknowledgment Note:</span> {rec.acknowledgmentNote}{' '}
                    <span className="text-[10px] text-emerald-600 block mt-0.5">
                      Acknowledged on {new Date(rec.acknowledgedAt!).toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Comment & Discussion Thread */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <MessageSquare className="w-3.5 h-3.5 text-brand-500" />
                    <span>Discussion & Questions ({rec.comments?.length || 0})</span>
                  </div>

                  {rec.comments && rec.comments.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {rec.comments.map((c) => (
                        <div
                          key={c.id}
                          className={`p-3 rounded-xl text-xs space-y-1 ${
                            c.author.role === 'MENTEE'
                              ? 'bg-slate-50 dark:bg-slate-800/80 ml-4'
                              : 'bg-brand-50/60 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900/50 mr-4'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                              {c.author.role === 'MENTOR' ? 'Faculty Mentor' : 'You (Mentee)'}
                            </span>
                            <span>{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300">{c.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add comment box */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a comment or ask a question regarding this recommendation..."
                      value={commentText[rec.id] || ''}
                      onChange={(e) => setCommentText({ ...commentText, [rec.id]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddComment(rec.id);
                      }}
                      className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <Button
                      size="sm"
                      isLoading={commentLoading[rec.id]}
                      onClick={() => handleAddComment(rec.id)}
                      leftIcon={<Send className="w-3 h-3" />}
                    >
                      Reply
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Acknowledgment Modal */}
      <Modal
        isOpen={!!selectedRec}
        onClose={() => setSelectedRec(null)}
        title="Acknowledge Recommendation"
        description="Confirm that you have reviewed your mentor's guidance."
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs">
            <span className="font-bold text-slate-900 dark:text-white block">{selectedRec?.title}</span>
            <p className="text-slate-600 dark:text-slate-300 mt-1">{selectedRec?.description}</p>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
              Acknowledgment Note / Action Commitment (Optional)
            </label>
            <textarea
              rows={3}
              value={ackNote}
              onChange={(e) => setAckNote(e.target.value)}
              placeholder="e.g. Understood. I will begin work on this item immediately and update my progress."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedRec(null)}>
              Cancel
            </Button>
            <Button size="sm" isLoading={ackLoading} onClick={handleAcknowledge}>
              Confirm Acknowledgment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
