import { supabase } from "../config/supabase";

const uploadFile = async (file, bucketName = "images") => {
    // input: file
    // output: url
    console.log(file);

    const fileExt = file.name.split('.').pop(); // name.png
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const path = fileName;

    const { error } = await supabase.storage.from(bucketName).upload(path, file);

    if (error) console.log(error);

    // public URL
    const { data } = await supabase.storage.from(bucketName).getPublicUrl(path);
    return data.publicUrl;
};

export { uploadFile };