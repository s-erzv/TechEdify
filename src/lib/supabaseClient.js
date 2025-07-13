// my-frontend/src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('supabaseClient.js: Supabase URL:', supabaseUrl);
console.log('supabaseClient.js: Supabase Anon Key:', supabaseAnonKey ? '*****' : 'Missing');
console.log('supabaseClient.js: Supabase client initialized:', supabase);
console.log('supabaseClient.js: Supabase auth object:', supabase.auth);

// --- Fungsi untuk mencatat aktivitas harian (Sudah ada di kode Anda) ---
export const recordDailyActivity = async (userId, activityType = 'login', count = 1, duration = 0) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    const activityDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    // First, try to find existing record for today
    const { data: existingRecord, error: fetchError } = await supabase
      .from('user_daily_activity')
      .select('id, lessons_completed_count, quizzes_attempted_count, duration_minutes') // Secara eksplisit pilih kolom yang relevan dari skema Anda
      .eq('user_id', userId)
      .eq('activity_date', activityDate)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found (which is fine)
      throw fetchError;
    }

    if (existingRecord) {
      // Update existing record
      const updateData = { updated_at: new Date().toISOString() };
      let newLessonsCount = existingRecord.lessons_completed_count || 0;
      let newQuizzesCount = existingRecord.quizzes_attempted_count || 0;
      let newDuration = existingRecord.duration_minutes || 0;

      // Sesuaikan kolom berdasarkan activityType
      if (activityType === 'lesson_completed') {
        newLessonsCount += count;
      } else if (activityType === 'quiz_attempted') {
        newQuizzesCount += count;
      } else if (activityType === 'login') {
        newDuration += (duration > 0 ? duration : 1);
      }

      updateData.lessons_completed_count = newLessonsCount;
      updateData.quizzes_attempted_count = newQuizzesCount;
      updateData.duration_minutes = newDuration;

      console.log('DEBUG: Updating daily activity with:', updateData);
      const { data: updatedData, error: updateError } = await supabase
        .from('user_daily_activity')
        .update(updateData)
        .eq('id', existingRecord.id)
        .select('id, lessons_completed_count, quizzes_attempted_count, duration_minutes');

      if (updateError) throw updateError;
      console.log(`✅ Daily activity updated for ${activityDate}.`, updatedData);
    } else {
      // Create new record
      const insertData = {
        user_id: userId,
        activity_date: activityDate,
        lessons_completed_count: (activityType === 'lesson_completed' ? count : 0),
        quizzes_attempted_count: (activityType === 'quiz_attempted' ? count : 0),
        duration_minutes: (activityType === 'login' && duration <= 0 ? 1 : duration),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      console.log('DEBUG: Inserting new daily activity with:', insertData);
      const { data: insertedData, error: insertError } = await supabase
        .from('user_daily_activity')
        .insert([insertData])
        .select('id, lessons_completed_count, quizzes_attempted_count, duration_minutes');

      if (insertError) throw insertError;
      console.log(`✅ New daily activity record created for ${activityType} on ${activityDate}.`, insertedData);
    }

    return { success: true };
  } catch (error) {
    console.error('Error recording daily activity:', error.message);
    return { success: false, error: error.message };
  }
};

// --- Fungsi BARU: Memperbarui bonus_point user (Ini yang saya tambahkan) ---
export const updateUserBonusPoints = async (userId, pointsToAdd) => {
    try {
        const { data, error: fetchError } = await supabase
            .from('profiles')
            .select('bonus_point')
            .eq('id', userId)
            .single();

        if (fetchError) {
            console.error("Error fetching current bonus points:", fetchError.message);
            throw fetchError;
        }

        const currentPoints = data?.bonus_point || 0;
        const newPoints = currentPoints + pointsToAdd;

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ bonus_point: newPoints })
            .eq('id', userId);

        if (updateError) {
            console.error(`Error updating bonus points for user ${userId}:`, updateError.message);
            throw updateError;
        }

        console.log(`User ${userId} awarded ${pointsToAdd} points. New total: ${newPoints}`);
        return newPoints;
    } catch (err) {
        console.error("Failed to update user bonus points:", err.message);
        return null;
    }
};