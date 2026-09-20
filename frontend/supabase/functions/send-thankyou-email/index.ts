
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// CORS Headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ThankYouRequest {
  email: string;      // Recipient's email
  name?: string;      // Optional full name
}

const kamandaBrandColor = "#0e81e2"; // KamandaLabs blue, adjust as needed
const kamandaBg = "#f5f8ff"; // App light background

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name } = await req.json() as ThankYouRequest;

    // Build branded HTML
    const html = `
      <div style="background:${kamandaBg};padding:40px 0; font-family: Inter,Arial,sans-serif;">
        <div style="max-width:520px;margin:0 auto;box-shadow:0 2px 16px #e0e4fa;border-radius:16px;background:#fff;overflow:hidden;">
          <div style="background:${kamandaBrandColor};padding:28px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-weight:700;font-size:2rem;letter-spacing:1px;">
              KamandaLabs
            </h1>
          </div>
          <div style="padding:32px 24px 20px 24px;text-align:center;">
            <h2 style="color:${kamandaBrandColor};margin-top:0;font-size:1.3rem;">Welcome${name ? `, ${name}` : ""}!</h2>
            <p style="color:#222;font-size:1.1rem;">
              Thank you for joining <span style="color:${kamandaBrandColor};font-weight:600;">KamandaLabs</span>.
            </p>
            <p>
              You’re now part of our growing community of GIS professionals and environmental innovators.
              Explore advanced mapping, environmental analytics, and professional reporting—all in one place.
            </p>
            <div style="margin:20px 0;">
              <ul style="padding:0;text-align:left;display:inline-block;">
                <li>✓ Access real-time environmental dashboards</li>
                <li>✓ Set up monitoring points and geo-features</li>
                <li>✓ Generate beautiful custom maps & reports</li>
                <li>✓ Collaborate with the KamandaLabs community</li>
              </ul>
            </div>
            <p style="font-size:15px;color:#888;margin-top:28px;">
              Need help? Reply to this email, or visit our <a href="https://kamandalabs.com/support" style="color:${kamandaBrandColor};text-decoration:underline;">Support Center</a>.
            </p>
          </div>
          <div style="background:#f7fafd;padding:12px;text-align:center;color:#94a3b8;font-size:0.93rem;">
            &copy; ${new Date().getFullYear()} KamandaLabs. All rights reserved.
          </div>
        </div>
      </div>
    `;

    const sendResult = await resend.emails.send({
      from: "KamandaLabs <onboarding@kamandalabs.com>", // Update the domain/email as needed for your verified domain
      to: [email],
      subject: "Welcome to KamandaLabs! 🚀",
      html,
    });

    return new Response(
      JSON.stringify({ status: "sent", sendResult }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    console.error("[KamandaLabs] Email sending error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
};

serve(handler);

