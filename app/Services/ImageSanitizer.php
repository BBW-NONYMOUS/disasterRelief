<?php

namespace App\Services;

use GdImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Re-encodes uploaded photos with GD so EXIF/GPS/XMP metadata never reaches
 * the public disk, and stores them under random names. JPEG orientation is
 * applied first (read straight from the EXIF block, no exif extension
 * needed) so phone photos are not left sideways once the tag is gone.
 */
class ImageSanitizer
{
    public function store(UploadedFile $file, string $directory, string $disk = 'public', string $field = 'photos'): string
    {
        $bytes = (string) file_get_contents($file->getRealPath());
        $image = @imagecreatefromstring($bytes);

        if (! $image instanceof GdImage) {
            throw ValidationException::withMessages([$field => 'One of the images could not be processed. Please upload a JPEG, PNG or WebP photo.']);
        }

        $mime = $file->getMimeType();
        if ($mime === 'image/jpeg') {
            $image = $this->orient($image, $this->jpegOrientation($bytes));
        }

        [$extension, $encoded] = $this->encode($image, $mime);

        $path = trim($directory, '/').'/'.Str::random(40).'.'.$extension;
        Storage::disk($disk)->put($path, $encoded);

        return $path;
    }

    /** @return array{0: string, 1: string} extension and encoded bytes */
    private function encode(GdImage $image, ?string $mime): array
    {
        ob_start();
        if ($mime === 'image/png') {
            imagesavealpha($image, true);
            imagepng($image, null, 6);
            $extension = 'png';
        } elseif ($mime === 'image/webp' && function_exists('imagewebp')) {
            imagewebp($image, null, 85);
            $extension = 'webp';
        } else {
            imagejpeg($image, null, 85);
            $extension = 'jpg';
        }

        return [$extension, (string) ob_get_clean()];
    }

    private function orient(GdImage $image, int $orientation): GdImage
    {
        $rotate = fn (GdImage $img, int $deg) => imagerotate($img, $deg, 0) ?: $img;
        $flip = function (GdImage $img) {
            imageflip($img, IMG_FLIP_HORIZONTAL);

            return $img;
        };

        // imagerotate() turns counter-clockwise.
        return match ($orientation) {
            2 => $flip($image),
            3 => $rotate($image, 180),
            4 => $flip($rotate($image, 180)),
            5 => $flip($rotate($image, 270)),
            6 => $rotate($image, 270),
            7 => $flip($rotate($image, 90)),
            8 => $rotate($image, 90),
            default => $image,
        };
    }

    /** Walks the JPEG segments to the APP1 Exif block and reads tag 0x0112. */
    private function jpegOrientation(string $bytes): int
    {
        $length = strlen($bytes);
        if ($length < 4 || substr($bytes, 0, 2) !== "\xFF\xD8") {
            return 1;
        }

        $offset = 2;
        while ($offset + 4 <= $length) {
            if ($bytes[$offset] !== "\xFF") {
                return 1;
            }

            $marker = ord($bytes[$offset + 1]);
            if ($marker === 0xDA || $marker === 0xD9) {
                return 1; // start of scan / end of image: no Exif block
            }

            $segmentLength = unpack('n', substr($bytes, $offset + 2, 2))[1];
            if ($marker === 0xE1 && substr($bytes, $offset + 4, 6) === "Exif\0\0") {
                return $this->tiffOrientation(substr($bytes, $offset + 10, $segmentLength - 8));
            }

            $offset += 2 + $segmentLength;
        }

        return 1;
    }

    private function tiffOrientation(string $tiff): int
    {
        $size = strlen($tiff);
        if ($size < 8) {
            return 1;
        }

        $littleEndian = substr($tiff, 0, 2) === 'II';
        $u16 = fn (int $at) => $at + 2 <= $size ? unpack($littleEndian ? 'v' : 'n', substr($tiff, $at, 2))[1] : 0;
        $u32 = fn (int $at) => $at + 4 <= $size ? unpack($littleEndian ? 'V' : 'N', substr($tiff, $at, 4))[1] : 0;

        $ifd = $u32(4);
        $entries = $u16($ifd);
        for ($i = 0; $i < $entries; $i++) {
            $entry = $ifd + 2 + $i * 12;
            if ($u16($entry) === 0x0112) {
                $value = $u16($entry + 8);

                return $value >= 1 && $value <= 8 ? $value : 1;
            }
        }

        return 1;
    }
}
