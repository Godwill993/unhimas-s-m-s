import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';

export const announcementsRouter = Router();

// GET announcements (role-filtered for authenticated user)
announcementsRouter.get('/', authenticate, async (req, res) => {
  try {
    const userRole = req.user!.role;

    // Fetch announcements that are either targeted to this role or global (target_role IS NULL)
    const { data, error } = await supabaseAdmin
      .from('announcements')
      .select('*, user_profiles(full_name)')
      .or(`target_role.eq.${userRole},target_role.is.null`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ announcements: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST announcement (admin only)
announcementsRouter.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { title, content, target_role } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('announcements')
      .insert({
        title,
        content,
        target_role: target_role || null,
        author_id: req.user!.id,
      })
      .select('*, user_profiles(full_name)')
      .single();

    if (error) throw error;
    res.status(201).json({ announcement: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE announcement (admin only)
announcementsRouter.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('announcements').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
