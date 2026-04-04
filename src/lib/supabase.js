import { createClient } from "@supabase/supabase-js";
import { BsDatabaseExclamation } from "react-icons/bs";
import 'dotenv/config';

const supabaseUrl = "https://vcbqhwxlwmhwdbcplgbj.supabase.co";
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
