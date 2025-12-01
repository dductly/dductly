import { serve } from "std/http/server";
import { Resend } from "resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // ----- PRE-FLIGHT -----
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,               // <— THIS IS CRITICAL
      headers: corsHeaders,
    });
  }

  try {
    const { fileName, fileContent } = await req.json();

    const emailResponse = await resend.emails.send({
      from: "Dductly <donotreply@mail.dductly.com>",
      to: ["alyse@dductly.com"],
      subject: `New File Uploaded: ${fileName}`,
      text: `A new CSV file was uploaded.\n\nFile name: ${fileName}\n\nContent:\n${fileContent}`,
    });

    return new Response(JSON.stringify({ message: "Email sent", emailResponse }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: `${err}` }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});
