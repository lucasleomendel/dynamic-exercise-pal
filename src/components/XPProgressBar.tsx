import React from 'react';
import './XPProgressBar.css'; // Assume you have a CSS file for styles

interface XPProgressBarProps {
    xp: number;
    streak: number;
    level: 'beginner' | 'intermediate' | 'advanced';
    totalWorkouts: number;
    achievements: string[];
}

const XPProgressBar: React.FC<XPProgressBarProps> = ({ xp, streak, level, totalWorkouts, achievements }) => {
    const nextLevelXP = ((level === 'beginner') ? 100 : (level === 'intermediate') ? 200 : 300);
    const xpPercentage = (xp / nextLevelXP) * 100;

    return (
        <div className="xp-progress-bar-container">
            <div className="xp-progress-bar" style={{ width: `${xpPercentage}%`, backgroundColor: level === 'beginner' ? 'green' : (level === 'intermediate' ? 'blue' : 'purple') }}></div>
            <span>{xp} / {nextLevelXP} XP</span>
            <div className="fire-icon">
                {/* Replace with an actual fire icon, e.g., from FontAwesome */}
                <span>🔥 {streak}</span>
            </div>
            <div>
                <p>Total Workouts: {totalWorkouts}</p>
                <p>Achievements: {achievements.join(', ')}</p>
            </div>
        </div>
    );
};

export default XPProgressBar;