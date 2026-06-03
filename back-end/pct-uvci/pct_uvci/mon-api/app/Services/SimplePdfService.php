<?php

namespace App\Services;

class SimplePdfService
{
    public function make(string $title, array $lines): string
    {
        $pages = array_chunk($this->wrappedLines([$title, '', ...$lines]), 42);
        $objects = [];
        $pageObjectNumbers = [];

        $objects[] = '<< /Type /Catalog /Pages 2 0 R >>';
        $objects[] = '';

        foreach ($pages as $pageLines) {
            $content = $this->pageContent($pageLines);
            $contentObjectNumber = count($objects) + 2;
            $pageObjectNumbers[] = count($objects) + 1;

            $objects[] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 $contentObjectNumber 0 R >> >> /Contents ".($contentObjectNumber + 1).' 0 R >>';
            $objects[] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
            $objects[] = "<< /Length ".strlen($content)." >>\nstream\n$content\nendstream";
        }

        $kids = implode(' ', array_map(fn (int $number): string => "$number 0 R", $pageObjectNumbers));
        $objects[1] = "<< /Type /Pages /Kids [$kids] /Count ".count($pageObjectNumbers).' >>';

        return $this->document($objects);
    }

    private function wrappedLines(array $lines): array
    {
        $wrapped = [];

        foreach ($lines as $line) {
            $line = $this->normalize($line);

            foreach (str_split($line, 95) ?: [''] as $part) {
                $wrapped[] = $part;
            }
        }

        return $wrapped;
    }

    private function pageContent(array $lines): string
    {
        $content = "BT\n/F1 10 Tf\n50 800 Td\n14 TL\n";

        foreach ($lines as $line) {
            $content .= '('.$this->escape($line).") Tj\nT*\n";
        }

        return $content.'ET';
    }

    private function document(array $objects): string
    {
        $pdf = "%PDF-1.4\n";
        $offsets = [0];

        foreach ($objects as $index => $object) {
            $offsets[] = strlen($pdf);
            $pdf .= ($index + 1)." 0 obj\n$object\nendobj\n";
        }

        $xrefOffset = strlen($pdf);
        $pdf .= "xref\n0 ".(count($objects) + 1)."\n";
        $pdf .= "0000000000 65535 f \n";

        for ($i = 1; $i <= count($objects); $i++) {
            $pdf .= sprintf("%010d 00000 n \n", $offsets[$i]);
        }

        $pdf .= "trailer\n<< /Size ".(count($objects) + 1)." /Root 1 0 R >>\n";
        $pdf .= "startxref\n$xrefOffset\n%%EOF";

        return $pdf;
    }

    private function normalize(string $text): string
    {
        $text = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text) ?: $text;

        return preg_replace('/[^\x20-\x7E]/', '', $text) ?? '';
    }

    private function escape(string $text): string
    {
        return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $text);
    }
}
