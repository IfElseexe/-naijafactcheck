import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://bovdruxbhynhtzszxmza.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvdmRydXhiaHluaHR6c3p4bXphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MTM0NzMsImV4cCI6MjA5NDI4OTQ3M30._Rp5z3PWrZ253mJ_Rih7mqBgWnoMvjDTNz75N68zYqQ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)