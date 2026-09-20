
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

export const useAutoAdminAssignment = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const assignAdminIfFirst = async () => {
      if (!user) return;

      try {
        // Check if there are any existing user roles
        const { data: existingRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('id')
          .limit(1);

        if (rolesError) {
          console.error('Error checking existing roles:', rolesError);
          return;
        }

        // If no roles exist, make this user an admin
        if (!existingRoles || existingRoles.length === 0) {
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert([{ user_id: user.id, role: 'admin' }]);

          if (insertError) {
            console.error('Error assigning admin role:', insertError);
          } else {
            toast({
              title: "Welcome!",
              description: "You've been assigned admin privileges as the first user.",
            });
          }
        }
      } catch (error) {
        console.error('Error in auto admin assignment:', error);
      }
    };

    assignAdminIfFirst();
  }, [user, toast]);
};
