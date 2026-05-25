export async function POST(req: Request) {
try {
const body = await req.json();

const response = await fetch(
"https://reels-render-service.onrender.com/render",
{
method: "POST",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify(body),
}
);

const arrayBuffer = await response.arrayBuffer();

return new Response(arrayBuffer, {
status: response.status,
headers: {
"Content-Type": "video/mp4",
},
});
} catch (error) {
console.error(error);

return Response.json(
{ error: "Erro ao renderizar vídeo" },
{ status: 500 }
);
}
}
