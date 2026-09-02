import { createServiceClient } from '@/lib/supabase/service'
import { generateBlogOgImage } from './generateBlogOgImage'

export async function uploadBlogOgImage(
  postId: string,
  title: string,
): Promise<string | null> {
  try {
    const supabase = createServiceClient()

    // Generate PNG buffer
    const imageBuffer = await generateBlogOgImage(title)

    // Storage path — clean filename, no special characters
    const storagePath = `${postId}/og-image.png`

    // Upload to blog-covers bucket
    const { error: uploadError } = await supabase.storage
      .from('blog-covers')
      .upload(storagePath, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadError) {
      console.error('[OG] Storage upload failed:', uploadError.message)
      return null
    }

    // Get public URL
    const { data } = supabase.storage
      .from('blog-covers')
      .getPublicUrl(storagePath)

    const ogImageUrl = data.publicUrl

    // Update og_image_url in blog_posts
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({ og_image_url: ogImageUrl })
      .eq('id', postId)

    if (updateError) {
      console.error('[OG] DB update failed:', updateError.message)
      return null
    }

    return ogImageUrl
  } catch (err) {
    // OG generation failure must never break post creation
    console.error('[OG] Generation failed:', err)
    return null
  }
}
