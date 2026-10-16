'use client';

import { SelectChallenge } from './SelectChallenge';
import { AssistChallenge } from './AssistChallenge';
import { TranslateChallenge } from './TranslateChallenge';
import { ChallengeProps } from './ChallengeBase';

export function Challenge({ 
  type, 
  ...props 
}: ChallengeProps & { type: string }) {
  const challengeType = type as 'SELECT' | 'ASSIST' | 'TRANSLATE' | 'MATCH' | 'ORDER' | 'SPEAK' | 'LISTEN' | 'CONVERSATION';
  switch (challengeType) {
    case 'SELECT':
      return <SelectChallenge type={challengeType} {...props} />;
    case 'ASSIST':
      return <AssistChallenge type={challengeType} {...props} />;
    case 'TRANSLATE':
      return <TranslateChallenge type={challengeType} {...props} />;
    case 'MATCH':
    case 'ORDER':
      return <SelectChallenge type={challengeType} {...props} />;
    case 'SPEAK':
    case 'LISTEN':
    case 'CONVERSATION':
      return <SelectChallenge type={"SELECT"} {...props} />;
    default:
      return <SelectChallenge type={"SELECT"} {...props} />;
  }
}