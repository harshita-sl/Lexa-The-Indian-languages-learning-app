'use client';

import { SelectChallenge } from './SelectChallenge';
import { AssistChallenge } from './AssistChallenge';
import { TranslateChallenge } from './TranslateChallenge';
import { SpeakChallenge } from './SpeakChallenge';
import { ListenChallenge } from './ListenChallenge';
import { ConversationChallenge } from './ConversationChallenge';
import { ChallengeProps } from './ChallengeBase';

export function Challenge({
  type,
  ...props
}: ChallengeProps & { type: string }) {
  const challengeType = type as ChallengeProps['type'];
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
      return <SpeakChallenge type={challengeType} {...props} />;
    case 'LISTEN':
      return <ListenChallenge type={challengeType} {...props} />;
    case 'CONVERSATION':
      return <ConversationChallenge type={challengeType} {...props} />;
    default:
      return <SelectChallenge type={'SELECT'} {...props} />;
  }
}
