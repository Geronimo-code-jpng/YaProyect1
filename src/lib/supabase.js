import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPBASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getProfiles() {
    const { data, error } = await supabase.from("perfiles").select("id");

    if (error) {
        console.log(await error)
    }


    return data
}

console.log(await getProfiles())
