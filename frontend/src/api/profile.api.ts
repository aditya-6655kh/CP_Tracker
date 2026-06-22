import api from "./axios";
import type { Profile, ApiResponse } from "../types";

export const getProfile = async (): Promise<Profile | null> => {
    try{
        const res = await api.get<ApiResponse<Profile>>("profile");
        return res.data.data ?? null;
    }catch(err : any){
        if(err.response?.status === 404) return null;
        throw err;
    }
}

export const updateProfile = async (data: {
    cfHandle?: string;
    leetcodeHandle?: string;
    gfgHandle?: string;
}): Promise<Profile> => {
    const res = await api.patch<ApiResponse<Profile>>('profile', data);
    return res.data.data!;
}
