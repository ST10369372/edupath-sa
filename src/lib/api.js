// src/lib/api.js
import { supabase } from './supabase'

async function getUserId() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!user) throw new Error('Not authenticated')
  return user.id
}

export const api = {
  async get(path) {
    if (path === '/api/subjects') {
      const userId = await getUserId()
      const { data, error } = await supabase
        .from('student_subjects')
        .select('subject, mark')
        .eq('user_id', userId)
      if (error) throw error
      return data
    }
    if (path === '/api/saved-pathways') {
      const userId = await getUserId()
      const { data, error } = await supabase
        .from('saved_pathways')
        .select('id, pathway_key, pathway, profile_snapshot, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
    if (path === '/api/pathway-tasks') {
      const userId = await getUserId()
      const { data, error } = await supabase
        .from('pathway_tasks')
        .select('id, title, completed, created_at, saved_pathway_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
    throw new Error(`Unhandled GET path: ${path}`)
  },

  async put(path, body) {
    if (path === '/api/subjects') {
      const userId = await getUserId()

      // Replace the user's subject rows with the new set
      const { error: deleteError } = await supabase
        .from('student_subjects')
        .delete()
        .eq('user_id', userId)
      if (deleteError) throw deleteError

      if (body.subjects?.length) {
        const rows = body.subjects.map(s => ({
          user_id: userId,
          subject: s.subject,
          mark: s.mark,
        }))
        const { error: insertError } = await supabase
          .from('student_subjects')
          .insert(rows)
        if (insertError) throw insertError
      }
      return { ok: true }
    }
    throw new Error(`Unhandled PUT path: ${path}`)
  },

  async post(path, body) {
    if (path === '/api/pathways') {
      const userId = await getUserId()
      const { error } = await supabase.from('pathway_recommendations').insert({
        user_id: userId,
        subjects_snapshot: body.subjects_snapshot,
        recommendations: body.recommendations,
      })
      if (error) throw error
      return { ok: true }
    }
    if (path === '/api/saved-pathways') {
      const userId = await getUserId()
      const { data, error } = await supabase
        .from('saved_pathways')
        .upsert({
          user_id: userId,
          pathway_key: body.pathway_key,
          pathway: body.pathway,
          profile_snapshot: body.profile_snapshot,
        }, { onConflict: 'user_id,pathway_key' })
        .select('id, pathway_key, pathway, profile_snapshot, created_at')
        .single()
      if (error) throw error
      return data
    }
    if (path === '/api/pathway-tasks') {
      const userId = await getUserId()
      const rows = body.tasks.map(task => ({
        user_id: userId,
        saved_pathway_id: body.saved_pathway_id || null,
        title: task,
      }))
      const { data, error } = await supabase
        .from('pathway_tasks')
        .upsert(rows, { onConflict: 'user_id,title', ignoreDuplicates: true })
        .select('id, title, completed, created_at, saved_pathway_id')
      if (error) throw error
      return data
    }
    throw new Error(`Unhandled POST path: ${path}`)
  },

  async patch(path, body) {
    const userId = await getUserId()
    if (path === '/api/pathway-tasks') {
      const { data, error } = await supabase
        .from('pathway_tasks')
        .update({ completed: body.completed })
        .eq('id', body.id)
        .eq('user_id', userId)
        .select('id, title, completed, created_at, saved_pathway_id')
        .single()
      if (error) throw error
      return data
    }
    throw new Error(`Unhandled PATCH path: ${path}`)
  },

  async delete(path, id) {
    const userId = await getUserId()
    const table = path === '/api/saved-pathways'
      ? 'saved_pathways'
      : path === '/api/pathway-tasks'
        ? 'pathway_tasks'
        : null
    if (!table) throw new Error(`Unhandled DELETE path: ${path}`)

    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw error
    return { ok: true }
  },
}