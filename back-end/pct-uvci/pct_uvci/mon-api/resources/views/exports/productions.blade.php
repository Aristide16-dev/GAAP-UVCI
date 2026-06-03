<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <style>
        @page {
            margin: 35mm 15mm 22mm 15mm;
            size: a4 landscape;
        }
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 9pt;
            color: #1f2937;
            margin: 0;
            padding: 0;
            line-height: 1.6;
        }
        .page-number::after { content: counter(page); }
        .page-count::after  { content: counter(pages); }
    </style>
</head>
<body>

{{-- HEADER OFFICIEL FIXE --}}
<div style="position:fixed; top:-35mm; left:-15mm; right:-15mm; height:31mm; background:#ffffff; z-index:100;">
    <table style="width:100%; border-collapse:collapse; height:28mm;">
        <tr>
            <td style="padding:15px 20px; vertical-align:middle; width:52%;">
                <table style="border-collapse:collapse;">
                    <tr>
                        <td style="vertical-align:middle; padding-right:14px;"></td>
                        <td style="vertical-align:middle; border-left:2px solid #d1d5db; padding-left:14px;">
                            <div style="font-size:9.5pt; font-weight:bold; color:#111827; line-height:1.3; letter-spacing:0.3px;">UNIVERSITÉ VIRTUELLE<br>DE CÔTE D'IVOIRE</div>
                            <div style="font-size:6.5pt; color:#6b7280; font-style:italic; margin-top:2px;">mon université partout et à tout moment</div>
                        </td>
                    </tr>
                </table>
            </td>
            <td style="padding:15px 20px; vertical-align:middle; text-align:right; width:48%;">
                <div style="font-size:8pt; font-weight:bold; color:#5a0661; letter-spacing:0.5px; line-height:1.4; margin-bottom:5px;">
                    Gestion Automatisée des Activités<br>Pédagogiques de l'UVCI (GAAP-UVCI)
                </div>
                <div style="font-size:7.5pt; color:#4b5563;"><strong>Date de téléchargement :</strong> {{ $date }}</div>
            </td>
        </tr>
    </table>
</div>

{{-- FOOTER FIXE --}}
<div style="position:fixed; bottom:-22mm; left:-15mm; right:-15mm; height:15mm; background:#ffffff; border-top:1px solid #e5e7eb; z-index:100;">
    <table style="width:100%; height:100%; border-collapse:collapse;">
        <tr>
            <td style="padding:0 20px; vertical-align:middle;">
                <span style="font-size:6.5pt; color:#9ca3af; font-style:italic;">Document officiel à usage administratif — Université Virtuelle de Côte d'Ivoire</span>
            </td>
            <td style="padding:0 20px; vertical-align:middle; text-align:right; white-space:nowrap;">
                <span style="font-size:8.5pt; font-weight:bold; color:#5a0661;"><span class="page-number"></span></span>
            </td>
        </tr>
    </table>
</div>

{{-- TITRE DE L'ACTE --}}
<div style="text-align:center; margin-top:25px; margin-bottom:35px;">
    <h1 style="font-size:16pt; font-weight:bold; color:#111827; text-transform:uppercase; letter-spacing:1px; margin:0; padding-bottom:8px;">RAPPORT DES PRODUCTIONS PÉDAGOGIQUES</h1>
    <div style="width:80px; height:2px; background-color:#5a0661; margin:0 auto 8px auto;"></div>
    <div style="font-size:9pt; color:#4b5563; font-style:italic;">@if($filtres){{ $filtres }}@else État des activités pédagogiques saisies et validées @endif</div>
</div>

{{-- CARTOUCHE DE SYNTHÈSE --}}
<table style="width:100%; border-collapse:collapse; margin-bottom:35px; border:1px solid #d1d5db;">
    <tr style="background-color:#f9fafb;">
        <td style="padding:12px 15px; border-right:1px solid #d1d5db; width:33.33%;">
            <div style="font-size:7.5pt; color:#6b7280; text-transform:uppercase; font-weight:bold; margin-bottom:4px;">Volume horaire total :</div>
            <div style="font-size:10.5pt; font-weight:bold; color:#111827; text-align:right;">{{ number_format((float)$total_vh,2,',',' ') }} h</div>
        </td>
        <td style="padding:12px 15px; border-right:1px solid #d1d5db; width:33.33%;">
            <div style="font-size:7.5pt; color:#6b7280; text-transform:uppercase; font-weight:bold; margin-bottom:4px;">Activités validées :</div>
            <div style="font-size:10.5pt; font-weight:bold; color:#166534; text-align:right;">{{ $nb_valides }}</div>
        </td>
        <td style="padding:12px 15px; width:33.33%;">
            <div style="font-size:7.5pt; color:#6b7280; text-transform:uppercase; font-weight:bold; margin-bottom:4px;">En attente de validation :</div>
            <div style="font-size:10.5pt; font-weight:bold; color:#92400e; text-align:right;">{{ $nb_en_attente }}</div>
        </td>
    </tr>
</table>

{{-- TABLEAU PRINCIPAL --}}
<table style="width:100%; border-collapse:collapse; table-layout:fixed; margin-bottom:40px; font-size:7.5pt;">
    <thead>
        <tr style="background-color:#5a0661; color:#ffffff;">
            <th style="padding:8px 5px; text-align:center; font-size:7pt; font-weight:bold; width:4%; border:1px solid #5a0661;">N°</th>
            <th style="padding:8px 7px; text-align:left; font-size:7pt; font-weight:bold; width:17%; border:1px solid #5a0661;">Enseignant</th>
            <th style="padding:8px 7px; text-align:left; font-size:7pt; font-weight:bold; width:20%; border:1px solid #5a0661;">Cours</th>
            <th style="padding:8px 7px; text-align:left; font-size:7pt; font-weight:bold; width:16%; border:1px solid #5a0661;">Type d'activité</th>
            <th style="padding:8px 7px; text-align:left; font-size:7pt; font-weight:bold; width:12%; border:1px solid #5a0661;">Complexité</th>
            <th style="padding:8px 7px; text-align:center; font-size:7pt; font-weight:bold; width:10%; border:1px solid #5a0661;">Date</th>
            <th style="padding:8px 7px; text-align:right; font-size:7pt; font-weight:bold; width:9%; border:1px solid #5a0661;">VH (h)</th>
            <th style="padding:8px 7px; text-align:center; font-size:7pt; font-weight:bold; width:12%; border:1px solid #5a0661;">Statut</th>
        </tr>
    </thead>
    <tbody>
        @foreach($rows as $row)
        <tr style="background-color:{{ $loop->even ? '#fdfaff' : '#ffffff' }}; border-bottom:1px solid #e5e7eb;">
            <td style="padding:7px 5px; text-align:center; color:#6b7280; border-left:1px solid #e5e7eb; border-right:1px solid #e5e7eb; overflow:hidden;">{{ $loop->iteration }}</td>
            <td style="padding:7px 7px; color:#111827; border-right:1px solid #e5e7eb; overflow:hidden; word-wrap:break-word;">{{ $row['enseignant'] }}</td>
            <td style="padding:7px 7px; color:#374151; border-right:1px solid #e5e7eb; overflow:hidden; word-wrap:break-word;">{{ $row['cours'] }}</td>
            <td style="padding:7px 7px; color:#374151; border-right:1px solid #e5e7eb; overflow:hidden; word-wrap:break-word;">{{ $row['type'] }}</td>
            <td style="padding:7px 7px; color:#6b7280; border-right:1px solid #e5e7eb; overflow:hidden; word-wrap:break-word;">{{ $row['complexite'] }}</td>
            <td style="padding:7px 7px; text-align:center; color:#6b7280; border-right:1px solid #e5e7eb;">{{ $row['date'] ?? '—' }}</td>
            <td style="padding:7px 7px; text-align:right; color:#111827; font-weight:bold; border-right:1px solid #e5e7eb;">{{ number_format((float)$row['volume'],2,',',' ') }}</td>
            <td style="padding:7px 5px; text-align:center; border-right:1px solid #e5e7eb;">
                @if($row['statut'] === 'Validé')
                <span style="background:#dcfce7; color:#166534; padding:2px 6px; border-radius:10px; font-size:7pt; font-weight:bold;">Validé</span>
                @else
                <span style="background:#fef9c3; color:#854d0e; padding:2px 6px; border-radius:10px; font-size:7pt; font-weight:bold;">En attente</span>
                @endif
            </td>
        </tr>
        @endforeach
    </tbody>
    <tfoot>
        <tr style="background-color:#5a0661; color:#ffffff;">
            <td style="padding:9px 7px; font-weight:bold; font-size:8pt; border:1px solid #5a0661;" colspan="5">Total général</td>
            <td style="padding:9px 7px; text-align:right; font-weight:bold; font-size:8pt; border:1px solid #5a0661;">{{ number_format((float)$total_vh,2,',',' ') }} h</td>
            <td style="padding:9px 7px; text-align:center; font-size:7.5pt; border:1px solid #5a0661;" colspan="2">{{ $nb_valides }} validées / {{ $nb_en_attente }} en attente</td>
        </tr>
    </tfoot>
</table>

{{-- NOTE BAS DE PAGE --}}
<table style="width:100%; border-collapse:collapse; margin-top:10px;">
    <tr>
        <td style="width:4px; background-color:#5a0661;"></td>
        <td style="background-color:#f9fafb; border:1px solid #e5e7eb; border-left:none; padding:12px 15px; font-size:8pt; color:#374151; line-height:1.5;">
            <strong>Observations :</strong> Ce rapport présente l'ensemble des activités pédagogiques enregistrées dans le système. Les activités en attente de validation ne sont pas comptabilisées dans le calcul des paiements.
        </td>
    </tr>
</table>

</body>
</html>
