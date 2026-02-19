import { serve } from "std/http/server.ts";
import { Resend } from "resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { email, type, firstName } = await req.json();

    if (!email || !type) {
      return new Response(
        JSON.stringify({ error: "email and type are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const name = firstName || "there";
    let subject = "";
    let text = "";

    if (type === "password_changed") {
      subject = "Your dductly password was changed";
      text = `Hi ${name},\n\nYour dductly account password was recently changed. If you made this change, no further action is needed.\n\nIf you didn't make this change, please reset your password immediately by visiting dductly and clicking "Forgot your password?" on the sign-in page.\n\nStay safe,\nThe dductly team`;
    } else if (type === "email_changed") {
      subject = "Your dductly email was updated";
      text = `Hi ${name},\n\nThe email address on your dductly account was recently updated. If you made this change, no further action is needed.\n\nIf you didn't make this change, please contact us immediately at admin@dductly.com.\n\nStay safe,\nThe dductly team`;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid notification type" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const emailResponse = await resend.emails.send({
      from: "dductly <admin@dductly.com>",
      to: [email],
      subject,
      text,
    });

    return new Response(
      JSON.stringify({ message: "Notification sent", emailResponse }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: `${err}` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
