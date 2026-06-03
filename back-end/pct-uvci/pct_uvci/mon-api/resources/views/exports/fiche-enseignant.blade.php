<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <style>
        @page {
            margin: 42mm 15mm 22mm 15mm;
            size: a4 portrait;
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
<div style="position:fixed; top:-42mm; left:-15mm; right:-15mm; height:38mm; background:#ffffff; z-index:100;">
    <table style="width:100%; border-collapse:collapse; height:35mm;">
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
    <h1 style="font-size:16pt; font-weight:bold; color:#111827; text-transform:uppercase; letter-spacing:1px; margin:0; padding-bottom:8px;">FICHE INDIVIDUELLE DE L'ENSEIGNANT</h1>
    <div style="width:80px; height:2px; background-color:#5a0661; margin:0 auto 8px auto;"></div>
    <div style="font-size:9pt; color:#4b5563; font-style:italic;">Relevé des activités pédagogiques et récapitulatif financier</div>
</div>

{{-- BLOC IDENTITÉ --}}
<table style="width:100%; border-collapse:collapse; border:1px solid #d1d5db; background:#f9fafb; margin-bottom:20px;">
    <tr>
        <td style="padding:14px 16px; vertical-align:top; width:55%; border-right:1px solid #d1d5db;">
            <div style="font-size:13pt; font-weight:bold; color:#5a0661; margin-bottom:10px;">{{ $enseignant->nom_ens }} {{ $enseignant->pren_ens }}</div>
            <table style="border-collapse:collapse; width:100%;">
                <tr>
                    <td style="padding:3px 0;">
                        <span style="font-size:7.5pt; color:#6b7280; text-transform:uppercase; font-weight:bold;">Identifiant :</span>
                        <span style="font-size:9pt; color:#111827;"> {{ $enseignant->user_log_ens }}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding:3px 0;">
                        <span style="font-size:7.5pt; color:#6b7280; text-transform:uppercase; font-weight:bold;">Email :</span>
                        <span style="font-size:9pt; color:#111827;"> {{ $enseignant->email_ens }}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding:3px 0;">
                        <span style="font-size:7.5pt; color:#6b7280; text-transform:uppercase; font-weight:bold;">Téléphone :</span>
                        <span style="font-size:9pt; color:#111827;"> {{ $enseignant->tel_ens }}</span>
                    </td>
                </tr>
            </table>
        </td>
        <td style="padding:14px 16px; vertical-align:top; width:45%;">
            <table style="border-collapse:collapse; width:100%;">
                <tr>
                    <td style="padding:3px 0;">
                        <span style="font-size:7.5pt; color:#6b7280; text-transform:uppercase; font-weight:bold;">Grade :</span>
                        <span style="font-size:9pt; color:#111827;"> {{ $grade }}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding:3px 0;">
                        <span style="font-size:7.5pt; color:#6b7280; text-transform:uppercase; font-weight:bold;">Statut :</span>
                        <span style="font-size:9pt; color:#111827;"> {{ $statut }}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding:3px 0;">
                        <span style="font-size:7.5pt; color:#6b7280; text-transform:uppercase; font-weight:bold;">Département :</span>
                        <span style="font-size:9pt; color:#111827;"> {{ $departement }}</span>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>

{{-- CARTOUCHE DE SYNTHÈSE --}}
<table style="width:100%; border-collapse:collapse; margin-bottom:35px; border:1px solid #d1d5db;">
    <tr style="background-color:#f9fafb;">
        <td style="padding:12px 15px; border-right:1px solid #d1d5db; width:33.33%;">
            <div style="font-size:7.5pt; color:#6b7280; text-transform:uppercase; font-weight:bold; margin-bottom:4px;">Volume d'activités :</div>
            <div style="font-size:10.5pt; font-weight:bold; color:#111827; text-align:right;">{{ number_format((float)$summary['volume_total_heures'],2,',',' ') }} h</div>
        </td>
        <td style="padding:12px 15px; border-right:1px solid #d1d5db; width:33.33%;">
            <div style="font-size:7.5pt; color:#6b7280; text-transform:uppercase; font-weight:bold; margin-bottom:4px;">Taux horaire applicable :</div>
            <div style="font-size:10.5pt; font-weight:bold; color:#166534; text-align:right;">{{ number_format((float)$summary['taux_horaire'],0,',',' ') }} FCFA/h</div>
        </td>
        <td style="padding:12px 15px; width:33.33%;">
            <div style="font-size:7.5pt; color:#6b7280; text-transform:uppercase; font-weight:bold; margin-bottom:4px;">Montant estimé :</div>
            <div style="font-size:10.5pt; font-weight:bold; color:#92400e; text-align:right;">{{ number_format((float)$summary['montant_estime'],0,',',' ') }} FCFA</div>
        </td>
    </tr>
</table>

{{-- TABLEAU PRINCIPAL --}}
@php
    $lastColIndex = count($headers) - 1;
    $nbCols = count($headers);
    $numColWidth = 6;
    $lastColWidth = 18;
    $remaining = 100 - $numColWidth - $lastColWidth;
    $midColWidth = $nbCols > 1 ? round($remaining / ($nbCols - 1)) : $remaining;
@endphp
<table style="width:100%; border-collapse:collapse; table-layout:fixed; margin-bottom:40px;">
    <colgroup>
        <col style="width:{{ $numColWidth }}%;">
        @foreach($headers as $hIdx => $header)
        <col style="width:{{ $hIdx === $lastColIndex ? $lastColWidth : $midColWidth }}%;">
        @endforeach
    </colgroup>
    <thead>
        <tr style="background-color:#5a0661; color:#ffffff;">
            <th style="padding:10px 8px; text-align:center; font-size:8pt; font-weight:bold; border:1px solid #5a0661;">N°</th>
            @foreach($headers as $hIdx => $header)
            <th style="padding:10px 12px; text-align:{{ $hIdx === $lastColIndex ? 'right' : 'left' }}; font-size:8pt; font-weight:bold; border:1px solid #5a0661;">{{ $header }}</th>
            @endforeach
        </tr>
    </thead>
    <tbody>
        @foreach($rows as $row)
        <tr style="background-color:{{ $loop->even ? '#fdfaff' : '#ffffff' }}; border-bottom:1px solid #e5e7eb;">
            <td style="padding:9px 8px; text-align:center; color:#6b7280; border-left:1px solid #e5e7eb; border-right:1px solid #e5e7eb;">{{ $loop->iteration }}</td>
            @foreach($headers as $hIdx => $header)
            @php $val = $row[$hIdx] ?? ''; @endphp
            @if($hIdx === $lastColIndex)
            <td style="padding:9px 12px; text-align:right; color:#111827; font-weight:bold; border-right:1px solid #e5e7eb;">{{ number_format((float)$val,2,',',' ') }} h</td>
            @else
            <td style="padding:9px 12px; color:#111827; border-right:1px solid #e5e7eb; overflow:hidden; word-wrap:break-word;">{{ $val }}</td>
            @endif
            @endforeach
        </tr>
        @endforeach
    </tbody>
    <tfoot>
        <tr style="background-color:#5a0661; color:#ffffff;">
            <td style="padding:10px 12px; font-weight:bold; font-size:8.5pt; border:1px solid #5a0661;" colspan="{{ count($headers) }}">Volume total</td>
            <td style="padding:10px 12px; text-align:right; font-weight:bold; font-size:8.5pt; border:1px solid #5a0661;">{{ number_format((float)$summary['volume_total_heures'],2,',',' ') }} h</td>
        </tr>
    </tfoot>
</table>

{{-- NOTE BAS DE PAGE --}}
<table style="width:100%; border-collapse:collapse; margin-top:10px;">
    <tr>
        <td style="width:4px; background-color:#5a0661;"></td>
        <td style="background-color:#f9fafb; border:1px solid #e5e7eb; border-left:none; padding:12px 15px; font-size:8pt; color:#374151; line-height:1.5;">
            <strong>Observations :</strong> Les activités listées ci-dessus ont été enregistrées et validées dans le système GAAP-UVCI. Le montant estimé est calculé sur la base du taux horaire en vigueur et ne constitue pas un engagement de paiement.
        </td>
    </tr>
</table>

</body>
</html>
