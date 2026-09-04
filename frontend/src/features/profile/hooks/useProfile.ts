import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from "@tanstack/react-query";
import {
  fetchProfile,
  updateProfile,
  type UserProfile,
  type UpdateProfileInput,
} from "../api";

const PROFILE_KEY = ["profile"] as const;

export function useProfile(): UseQueryResult<UserProfile> {
  return useQuery<UserProfile>({
    queryKey: PROFILE_KEY,
    queryFn: fetchProfile,
  });
}

export function useUpdateProfile(): UseMutationResult<
  UserProfile,
  Error,
  UpdateProfileInput
> {
  const queryClient = useQueryClient();

  return useMutation<UserProfile, Error, UpdateProfileInput>({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY });
    },
  });
}
