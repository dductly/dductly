import { supabase } from '../lib/supabaseClient';

// Contact form data interface
export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
}

// Store contact form submission in Supabase database
export const sendContactEmail = async (formData: ContactFormData): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Attempting to submit contact form:', formData);
    
    const { data, error } = await supabase
      .from('contact_messages')  // Changed from 'contacts' to 'contact_messages'
      .insert([
        {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          message: formData.message,
        }
      ]);

    console.log('Supabase response:', { data, error });

    if (error) {
      console.error('Supabase error details:', error);
      return { 
        success: false, 
        error: `Failed to submit your message: ${error.message}` 
      };
    }

    console.log('Contact form submitted successfully');
    return { success: true };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { 
      success: false, 
      error: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};