import { chapters, PLAYABLE_CHAPTER_IDS } from '../../data/chapters.js';
import ChapterCard from './ChapterCard.jsx';

// Map 8 chương — unlock dần theo progress thật, chương chưa có nội dung hiện "Sắp ra mắt"
export default function ChapterMap({ progress, onSelectChapter }) {
  const { progress: state, isChapterUnlocked } = progress;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {chapters.map((chapter) => {
        const prevChapter = chapters.find((c) => c.id === chapter.id - 1);
        const prevMissionCount = prevChapter ? prevChapter.missionCount : 0;
        const inRoadmap = PLAYABLE_CHAPTER_IDS.includes(chapter.id);
        const unlockedByProgress = isChapterUnlocked(chapter.id, prevMissionCount);
        const playable = inRoadmap && unlockedByProgress;

        let status;
        if (playable) status = 'playable';
        else if (inRoadmap) status = 'locked';
        else status = 'coming-soon';

        const completedCount = Array.from({ length: chapter.missionCount }, (_, i) => i + 1).filter(
          (missionId) => state.completedMissions[`${chapter.id}-${missionId}`]
        ).length;

        return (
          <ChapterCard
            key={chapter.id}
            chapter={chapter}
            status={status}
            completedCount={completedCount}
            onSelect={onSelectChapter}
          />
        );
      })}
    </div>
  );
}
