import { getAdminContext } from "@/lib/server/auth";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function detectImage(bytes: Uint8Array) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { extension: "jpg", mime: "image/jpeg" };
  }
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= 8 && png.every((value, index) => bytes[index] === value)) {
    return { extension: "png", mime: "image/png" };
  }
  const header = new TextDecoder("ascii").decode(bytes.slice(0, 12));
  if (header.startsWith("RIFF") && header.slice(8, 12) === "WEBP") {
    return { extension: "webp", mime: "image/webp" };
  }
  return null;
}

export async function POST(request: Request) {
  const admin = await getAdminContext();
  if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });

  const declaredSize = Number(request.headers.get("content-length") ?? 0);
  if (declaredSize > MAX_IMAGE_BYTES + 64 * 1024) {
    return Response.json({ error: "Файл должен быть не больше 5 МБ." }, { status: 413 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return Response.json({ error: "Выберите изображение." }, { status: 422 });
    if (file.size < 16 || file.size > MAX_IMAGE_BYTES) {
      return Response.json({ error: "Файл должен быть от 16 байт до 5 МБ." }, { status: 422 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const detected = detectImage(bytes);
    if (!detected) return Response.json({ error: "Разрешены только настоящие JPG, PNG и WebP." }, { status: 422 });

    const path = `menu/${crypto.randomUUID()}.${detected.extension}`;
    const { error } = await admin.supabase.storage.from("menu-images").upload(path, bytes, {
      cacheControl: "31536000",
      upsert: false,
      contentType: detected.mime,
    });
    if (error) return Response.json({ error: "Не удалось загрузить изображение." }, { status: 500 });
    const { data } = admin.supabase.storage.from("menu-images").getPublicUrl(path);
    return Response.json({ url: data.publicUrl });
  } catch {
    return Response.json({ error: "Не удалось проверить изображение." }, { status: 500 });
  }
}

