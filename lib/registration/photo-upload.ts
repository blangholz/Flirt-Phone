// Twilio MMS attachments live behind authenticated URLs. We fetch with
// Basic auth (account_sid:auth_token), then upload the binary to Supabase
// Storage. The bucket is public, so the resulting URL is shareable on
// the Rolodex.

import { requireTwilio } from '@/lib/env';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const EXT_FROM_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
};

export async function fetchAndUploadPhoto(args: {
  mediaUrl: string;
  communityId: string;
  userId: string;
}): Promise<{ photoUrl: string; contentType: string }> {
  const env = requireTwilio();
  const auth = Buffer.from(
    `${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`,
  ).toString('base64');

  const mediaResponse = await fetch(args.mediaUrl, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!mediaResponse.ok) {
    throw new Error(
      `Twilio media fetch failed: ${mediaResponse.status} ${mediaResponse.statusText}`,
    );
  }

  const contentType = mediaResponse.headers.get('content-type') ?? 'image/jpeg';
  const ext = EXT_FROM_MIME[contentType.toLowerCase()] ?? 'jpg';
  const arrayBuffer = await mediaResponse.arrayBuffer();
  const objectKey = `${args.communityId}/${args.userId}.${ext}`;

  const supabase = createSupabaseAdminClient();
  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(objectKey, new Uint8Array(arrayBuffer), {
      contentType,
      upsert: true,
    });
  if (uploadError) {
    throw new Error(`Supabase upload failed: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from('photos').getPublicUrl(objectKey);
  return { photoUrl: data.publicUrl, contentType };
}
