import React from 'react';
import TeamEventsManagerTab from './DeveloperConsole/TeamEventsManagerTab';

export default function DeveloperEvents({ onNavigate }) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 mx-auto space-y-6 animate-in fade-in duration-300">
      <TeamEventsManagerTab onNavigate={onNavigate} />
    </div>
  );
}
