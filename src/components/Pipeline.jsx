import { useState, useCallback } from 'react';
import {
  DndContext, DragOverlay, closestCenter, useDraggable, useDroppable,
} from '@dnd-kit/core';
import { STAGES } from '../data/seed';
import JobCard from './JobCard';
import { Plus } from 'lucide-react';

// Confetti
function Confetti({ active }) {
  if (!active) return null;
  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    color: ['#6366f1', '#a855f7', '#22c55e', '#f59e0b', '#06b6d4', '#ec4899'][Math.floor(Math.random() * 6)],
    size: 6 + Math.random() * 6,
    rotate: Math.random() * 360,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute top-0 confetti-particle"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : 2,
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

function DraggableCard({ job, onEdit, onDelete, onMove }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: job.id });
  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.4 : 1, cursor: 'grab' }}
      {...listeners}
      {...attributes}
    >
      <JobCard
        job={job}
        onEdit={onEdit}
        onDelete={onDelete}
        onMove={onMove}
        stages={STAGES}
      />
    </div>
  );
}

function DroppableColumn({ stage, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  return (
    <div
      ref={setNodeRef}
      className="flex flex-col flex-1 min-h-[120px] rounded-xl transition-all"
      style={{
        border: isOver ? `2px dashed ${stage.color}` : '2px solid transparent',
        background: isOver ? `${stage.color}06` : 'transparent',
        padding: isOver ? 4 : 0,
      }}
    >
      {children}
    </div>
  );
}

function StageColumn({ stage, jobs, activeId, onEdit, onDelete, onMove, onAddJob }) {
  const stageJobs = jobs.filter((j) => j.stage === stage.id);

  return (
    <div className="flex flex-col shrink-0" style={{ width: 272 }}>
      {/* Column header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3 border"
        style={{ background: stage.bg, borderColor: stage.border }}
      >
        <span>{stage.emoji}</span>
        <span className="text-sm font-semibold" style={{ color: stage.color }}>{stage.label}</span>
        <span
          className="ml-auto text-xs font-medium px-1.5 py-0.5 rounded-full"
          style={{ background: `${stage.color}20`, color: stage.color }}
        >
          {stageJobs.length}
        </span>
        {stage.id !== 'rejected' && (
          <button
            onClick={() => onAddJob({ stage: stage.id })}
            className="w-5 h-5 rounded flex items-center justify-center transition-all"
            style={{ color: stage.color }}
            onMouseEnter={(e) => (e.currentTarget.style.background = `${stage.color}20`)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <Plus size={12} />
          </button>
        )}
      </div>

      <DroppableColumn stage={stage}>
        <div className="flex flex-col gap-2.5">
          {stageJobs.map((job) => (
            <DraggableCard
              key={job.id}
              job={job}
              onEdit={onEdit}
              onDelete={onDelete}
              onMove={onMove}
            />
          ))}
          {stageJobs.length === 0 && (
            <div
              className="rounded-xl border-2 border-dashed p-6 text-center"
              style={{ borderColor: `${stage.color}25` }}
            >
              <p className="text-xs" style={{ color: 'var(--text-5)' }}>Nothing here yet</p>
            </div>
          )}
        </div>
      </DroppableColumn>
    </div>
  );
}

export default function Pipeline({ jobs, onUpdateJob, onDeleteJob, onAddJob, onEditJob }) {
  const [confetti, setConfetti] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const activeJob = activeId ? jobs.find((j) => j.id === activeId) : null;

  const handleMove = useCallback((id, direction) => {
    const job = jobs.find((j) => j.id === id);
    if (!job) return;
    const currentIdx = STAGES.findIndex((s) => s.id === job.stage);
    const newStage = STAGES[currentIdx + direction];
    if (!newStage) return;
    const updates = { stage: newStage.id, stageChangedAt: new Date().toISOString() };
    if (newStage.id === 'applied' && !job.appliedDate) {
      updates.appliedDate = new Date().toISOString();
    }
    if (newStage.id === 'interview' || newStage.id === 'offer') {
      setConfetti(true);
      setTimeout(() => setConfetti(false), 2200);
    }
    onUpdateJob(id, updates);
  }, [jobs, onUpdateJob]);

  const handleDragStart = ({ active }) => setActiveId(active.id);

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over) return;
    const job = jobs.find((j) => j.id === active.id);
    if (!job || job.stage === over.id) return;
    const targetStage = STAGES.find((s) => s.id === over.id);
    if (!targetStage) return;
    const updates = { stage: targetStage.id, stageChangedAt: new Date().toISOString() };
    if (targetStage.id === 'applied' && !job.appliedDate) {
      updates.appliedDate = new Date().toISOString();
    }
    if (targetStage.id === 'interview' || targetStage.id === 'offer') {
      setConfetti(true);
      setTimeout(() => setConfetti(false), 2200);
    }
    onUpdateJob(active.id, updates);
  };

  return (
    <div className="px-4 md:px-6 py-4 md:py-6">
      <Confetti active={confetti} />

      {/* Content header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>Pipeline</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>
            {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} tracked across {STAGES.length} stages
          </p>
        </div>
      </div>

      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="pipeline-scroll pb-6">
          <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
            {STAGES.map((stage) => (
              <StageColumn
                key={stage.id}
                stage={stage}
                jobs={jobs}
                activeId={activeId}
                onEdit={onEditJob}
                onDelete={onDeleteJob}
                onMove={handleMove}
                onAddJob={onAddJob}
                />
            ))}
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeJob ? (
            <div style={{ transform: 'scale(1.03)', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', borderRadius: 12 }}>
              <JobCard
                job={activeJob}
                onEdit={() => {}}
                onDelete={() => {}}
                onMove={() => {}}
                stages={STAGES}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
