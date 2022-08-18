import fetch from 'isomorphic-fetch'
import { forumBaseUrl, forumUsername, forumApiKey } from './config'
// import FormData from 'form-data'

export async function forumPost (postTitle: string, postContent: string) {
  const url = `${forumBaseUrl}/posts.json`

  const form = new URLSearchParams({
    title: postTitle,
    raw: postContent,
    archetype: 'regular'
  })

  if (!forumUsername) {
    throw new Error('FORUM_USERNAME is required')
  }

  if (!forumApiKey) {
    throw new Error('FORUM_API_KEY is required')
  }

  const headers = {
    'Content-Type': 'multipart/form-data;',
    'Api-Key': forumApiKey,
    'Api-Username': forumUsername
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: form
  })

  const json = await res.json()
  const postUrl = `${forumBaseUrl}/t/${json.topic_slug}`
  return {
    postUrl,
    ...json
  }
}
