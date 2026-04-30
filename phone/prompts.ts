// User-facing phone prompts. Pulled out as constants so they're testable
// and translatable. All strings stay in plain language to read well via TTS.

export const prompts = {
  greeting:
    'Welcome to FlirtPhone. ' +
    'Press 1 to browse profiles. ' +
    'Press 3 to check your messages. ' +
    'Press 4 to send a message to a specific user.',

  // BROWSE MODE
  browseEmpty: 'No voice intros yet for this community. Hang up to return.',
  browseAfterIntro: (assignedNumber: number) =>
    `That was user ${assignedNumber}. ` +
    'Press 9 to send them a message. ' +
    'Press the pound key for next. ' +
    'Press 0 to return to the main menu.',
  browseEnd: 'You have heard everyone. Hang up to return.',

  // SEND MESSAGE MODE
  sendMessageEnterNumber:
    'Enter the three-digit number of the user you would like to message.',
  sendMessageCountdown: 'Recording in three, two, one.',
  sendMessageRecordingHint: 'After the beep, leave your message. Press the pound key when done.',
  sendMessageDone: 'Message sent. Hang up to return.',
  sendMessageRecipientNotFound: (digits: string) =>
    `No user found with number ${digits}. Try again, or press 0 to return.`,
  sendMessageNotAuthenticated:
    'You must be registered to send a message. Hang up and text us to register.',

  // CHECK MESSAGES MODE
  checkMessagesEnterOwnNumber: 'Enter your own three-digit number.',
  checkMessagesAuthFailed:
    'We could not find that number. Try again, or press 0 to return.',
  checkMessagesEmpty: 'You have no new messages. Hang up to return.',
  checkMessagesIncoming: 'New message.',
  checkMessagesAfterMessage:
    'Press 1 to respond. ' +
    'Press 2 to replay. ' +
    'Press 9 to match. ' +
    'Press the pound key for the next message.',
  checkMessagesAllHeard: 'You have heard all your messages. Hang up to return.',
  checkMessagesRecordResponse:
    'After the beep, record your response. Press the pound key when done.',
  checkMessagesResponseSent: 'Response sent.',
  checkMessagesMatchSuccess:
    'It is a match. You will receive their contact information by text shortly.',
  checkMessagesMatchAlready: 'You and this person are already matched.',

  // ERRORS
  unknownDigit: 'That key does not do anything here.',
  technicalDifficulty:
    'We hit a technical hiccup. Hang up and try again.',
} as const;

// Recording caps in seconds, matching PDK Decisions #6 + #7.
export const RECORDING_CAPS = {
  voiceIntro: 30,
  message: 120,
  response: 120,
} as const;
