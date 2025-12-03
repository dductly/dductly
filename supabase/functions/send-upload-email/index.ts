import { serve } from "std/http/server.ts"; // Note the .ts at the end, or ensure you are importing from the mapped path
import { Resend } from "resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  // Only POST for the actual request, OPTIONS for the preflight
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // ----- PRE-FLIGHT -----
  if (req.method === "OPTIONS") {
    // Correctly handles the preflight OPTIONS request
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { fileName, fileContent, fileType, userName } = await req.json();

    const senderName = userName || 'An Unknown User';

    const attachments = [
      {
        filename: fileName,
        content: fileContent,
        contentType: fileType || "application/octet-stream",
      },
    ];

    const emailResponse = await resend.emails.send({
      from: "dductly <admin@dductly.com>",
      to: ["admin@dductly.com"],
      subject: `NEW Upload by ${senderName}: ${fileName}`,
      text: `A new file was uploaded by ${senderName}.\n\nFile name: ${fileName}\n\nCheck the attachment for the content.`,
      attachments: attachments,
    });

    return new Response(JSON.stringify({ message: "Email sent", emailResponse }), {
      status: 200,
      headers: {
        ...corsHeaders, // ✅ CORS headers on successful response
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    // ✅ CRITICAL: Must include CORS headers on the error response
    return new Response(JSON.stringify({ error: `${err}` }), {
      status: 400,
      headers: {
        ...corsHeaders, // ✅ Added CORS headers here!
        "Content-Type": "application/json",
      },
    });
  }
});