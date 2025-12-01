import { contactApi, handleApiError } from '../api-client';

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Submit contact form
 */
export async function submitContactForm(
  data: ContactFormData
): Promise<{ success: boolean; message: string }> {
  try {
    await contactApi.submit(data);
    return { success: true, message: 'Message sent successfully!' };
  } catch (error) {
    const errorMessage = handleApiError(error);
    return { success: false, message: errorMessage };
  }
}

