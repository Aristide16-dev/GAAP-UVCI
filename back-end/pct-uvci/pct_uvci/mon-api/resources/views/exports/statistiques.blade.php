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
    <h1 style="font-size:16pt; font-weight:bold; color:#111827; text-transform:uppercase; letter-spacing:1px; margin:0; padding-bottom:8px;">RAPPORT DE STATISTIQUES PÉDAGOGIQUES</h1>
    <div style="width:80px; height:2px; background-color:#5a0661; margin:0 auto 8px auto;"></div>
    <div style="font-size:9pt; color:#4b5563; font-style:italic;">@if($filtres){{ $filtres }}@else Analyse consolidée des activités par type, département et période @endif</div>
</div>

{{-- CARTOUCHE DE SYNTHÈSE --}}
<table style="width:100%; border-collapse:collapse; margin-bottom:35px; border:1px solid #d1d5db;">
    <tr style="background-color:#f9fafb;">
        <td style="padding:12px 15px; border-right:1px solid #d1d5db; width:33.33%;">
            <div style="font-size:7.5pt; color:#6b7280; text-transform:uppercase; font-weight:bold; margin-bottom:4px;">Enseignants actifs :</div>
            <div style="font-size:10.5pt; font-weight:bold; color:#111827; text-align:right;">{{ $total_enseignants }}</div>
        </td>
        <td style="padding:12px 15px; border-right:1px solid #d1d5db; width:33.33%;">
            <div style="font-size:7.5pt; color:#6b7280; text-transform:uppercase; font-weight:bold; margin-bottom:4px;">Volume horaire total :</div>
            <div style="font-size:10.5pt; font-weight:bold; color:#166534; text-align:right;">{{ number_format((float)$total_heures,2,',',' ') }} h</div>
        </td>
        <td style="padding:12px 15px; width:33.33%;">
            <div style="font-size:7.5pt; color:#6b7280; text-transform:uppercase; font-weight:bold; margin-bottom:4px;">Total activités :</div>
            <div style="font-size:10.5pt; font-weight:bold; color:#92400e; text-align:right;">{{ $total_activites }}</div>
        </td>
    </tr>
</table>

{{-- SECTION 1 : PAR TYPE D'ACTIVITÉ --}}
<div style="font-size:8.5pt; font-weight:bold; color:#5a0661; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid #e5e7eb; padding-bottom:5px; margin:20px 0 10px 0;">Répartition par type d'activité</div>

<table style="width:100%; border-collapse:collapse; table-layout:fixed; margin-bottom:40px;">
    <colgroup>
        <col style="width:6%;">
        <col style="width:40%;">
        <col style="width:18%;">
        <col style="width:20%;">
        <col style="width:16%;">
    </colgroup>
    <thead>
        <tr style="background-color:#5a0661; color:#ffffff;">
            <th style="padding:10px 8px; text-align:center; font-size:8pt; font-weight:bold; border:1px solid #5a0661;">N°</th>
            <th style="padding:10px 12px; text-align:left; font-size:8pt; font-weight:bold; border:1px solid #5a0661;">Type d'activité</th>
            <th style="padding:10px 12px; text-align:center; font-size:8pt; font-weight:bold; border:1px solid #5a0661;">Nb. activités</th>
            <th style="padding:10px 12px; text-align:right; font-size:8pt; font-weight:bold; border:1px solid #5a0661;">Volume (h)</th>
            <th style="padding:10px 12px; text-align:right; font-size:8pt; font-weight:bold; border:1px solid #5a0661;">Part (%)</th>
        </tr>
    </thead>
    <tbody>
        @foreach($par_type as $item)
        <tr style="background-color:{{ $loop->even ? '#fdfaff' : '#ffffff' }}; border-bottom:1px solid #e5e7eb;">
            <td style="padding:9px 8px; text-align:center; color:#6b7280; border-left:1px solid #e5e7eb; border-right:1px solid #e5e7eb;">{{ $loop->iteration }}</td>
            <td style="padding:9px 12px; color:#111827; border-right:1px solid #e5e7eb; overflow:hidden; word-wrap:break-word;">{{ $item['label'] }}</td>
            <td style="padding:9px 12px; text-align:center; color:#374151; border-right:1px solid #e5e7eb;">{{ $item['count'] }}</td>
            <td style="padding:9px 12px; text-align:right; color:#111827; font-weight:bold; border-right:1px solid #e5e7eb;">{{ number_format((float)$item['volume'],2,',',' ') }}</td>
            <td style="padding:9px 12px; text-align:right; color:#374151; border-right:1px solid #e5e7eb;">{{ round($item['volume'] / max($total_heures, 0.01) * 100, 1) }} %</td>
        </tr>
        @endforeach
    </tbody>
    <tfoot>
        <tr style="background-color:#5a0661; color:#ffffff;">
            <td style="padding:10px 12px; font-weight:bold; font-size:8.5pt; border:1px solid #5a0661;" colspan="2">Total</td>
            <td style="padding:10px 12px; text-align:center; font-weight:bold; font-size:8.5pt; border:1px solid #5a0661;">{{ $total_activites }}</td>
            <td style="padding:10px 12px; text-align:right; font-weight:bold; font-size:8.5pt; border:1px solid #5a0661;">{{ number_format((float)$total_heures,2,',',' ') }}</td>
            <td style="padding:10px 12px; text-align:right; font-weight:bold; font-size:8.5pt; border:1px solid #5a0661;">100 %</td>
        </tr>
    </tfoot>
</table>

{{-- SECTION 2 : PAR DÉPARTEMENT --}}
<div style="font-size:8.5pt; font-weight:bold; color:#5a0661; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid #e5e7eb; padding-bottom:5px; margin:20px 0 10px 0;">Répartition par département</div>

<table style="width:100%; border-collapse:collapse; table-layout:fixed; margin-bottom:40px;">
    <colgroup>
        <col style="width:6%;">
        <col style="width:44%;">
        <col style="width:25%;">
        <col style="width:25%;">
    </colgroup>
    <thead>
        <tr style="background-color:#5a0661; color:#ffffff;">
            <th style="padding:10px 8px; text-align:center; font-size:8pt; font-weight:bold; border:1px solid #5a0661;">N°</th>
            <th style="padding:10px 12px; text-align:left; font-size:8pt; font-weight:bold; border:1px solid #5a0661;">Département</th>
            <th style="padding:10px 12px; text-align:center; font-size:8pt; font-weight:bold; border:1px solid #5a0661;">Nb. activités</th>
            <th style="padding:10px 12px; text-align:right; font-size:8pt; font-weight:bold; border:1px solid #5a0661;">Volume (h)</th>
        </tr>
    </thead>
    <tbody>
        @foreach($par_departement as $item)
        <tr style="background-color:{{ $loop->even ? '#fdfaff' : '#ffffff' }}; border-bottom:1px solid #e5e7eb;">
            <td style="padding:9px 8px; text-align:center; color:#6b7280; border-left:1px solid #e5e7eb; border-right:1px solid #e5e7eb;">{{ $loop->iteration }}</td>
            <td style="padding:9px 12px; color:#111827; border-right:1px solid #e5e7eb; overflow:hidden; word-wrap:break-word;">{{ $item['label'] }}</td>
            <td style="padding:9px 12px; text-align:center; color:#374151; border-right:1px solid #e5e7eb;">{{ $item['count'] }}</td>
            <td style="padding:9px 12px; text-align:right; color:#111827; font-weight:bold; border-right:1px solid #e5e7eb;">{{ number_format((float)$item['volume'],2,',',' ') }}</td>
        </tr>
        @endforeach
    </tbody>
</table>

{{-- SECTION 3 : ÉVOLUTION MENSUELLE --}}
<div style="font-size:8.5pt; font-weight:bold; color:#5a0661; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid #e5e7eb; padding-bottom:5px; margin:20px 0 10px 0;">Évolution mensuelle — Production</div>

@php
    $moisFr    = ['','Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    $moisAbr   = ['','Janv','Févr','Mars','Avr','Mai','Juin','Juil','Août','Sept','Oct','Nov','Déc'];
    $maxVol    = count($par_mois) > 0 ? max(array_column($par_mois, 'volume')) : 0;
    $maxBarH   = 80;
@endphp

{{-- GRAPHIQUE À BARRES PRODUCTION --}}
@if(count($par_mois) > 0 && $maxVol > 0)
<table style="width:100%; border-collapse:collapse; table-layout:fixed; margin-bottom:2px;">
    <tr>
        @foreach($par_mois as $item)
        @php
            $barH   = max(4, (int)round(($item['volume'] / $maxVol) * $maxBarH));
            $emptyH = $maxBarH - $barH;
            $parts  = explode('-', $item['mois']);
            $m      = isset($parts[1]) ? (int)$parts[1] : 0;
            $abr    = $moisAbr[$m] ?? $item['mois'];
        @endphp
        <td style="text-align:center; padding:0 3px; vertical-align:top;">
            <div style="font-size:5.5pt; font-weight:bold; color:#5a0661; line-height:1.4;">{{ number_format((float)$item['volume'],1,',','') }}h</div>
            <table style="width:100%; border-collapse:collapse;">
                <tr><td style="height:{{ $emptyH }}px; padding:0; font-size:1px; line-height:0; background-color:#ede9fe; border-radius:2px 2px 0 0;">&#160;</td></tr>
                <tr><td style="height:{{ $barH }}px; padding:0; font-size:1px; line-height:0; background-color:#7c3aed; border-radius:2px 2px 0 0;">&#160;</td></tr>
            </table>
            <div style="font-size:5.5pt; color:#6b7280; font-weight:bold; margin-top:2px; overflow:hidden;">{{ $abr }}</div>
        </td>
        @endforeach
    </tr>
</table>
<div style="height:1px; background-color:#5a0661; margin-bottom:12px;"></div>
@endif

<table style="width:100%; border-collapse:collapse; table-layout:fixed; margin-bottom:40px;">
    <colgroup>
        <col style="width:40%;">
        <col style="width:30%;">
        <col style="width:30%;">
    </colgroup>
    <thead>
        <tr style="background-color:#5a0661; color:#ffffff;">
            <th style="padding:10px 12px; text-align:left; font-size:8pt; font-weight:bold; border:1px solid #5a0661;">Mois</th>
            <th style="padding:10px 12px; text-align:center; font-size:8pt; font-weight:bold; border:1px solid #5a0661;">Nb. activités</th>
            <th style="padding:10px 12px; text-align:right; font-size:8pt; font-weight:bold; border:1px solid #5a0661;">Volume (h)</th>
        </tr>
    </thead>
    <tbody>
        @foreach($par_mois as $item)
        @php
            $parts = explode('-', $item['mois']);
            $annee = $parts[0] ?? '';
            $numMois = isset($parts[1]) ? (int)$parts[1] : 0;
            $moisLabel = ($moisFr[$numMois] ?? $item['mois']) . ' ' . $annee;
        @endphp
        <tr style="background-color:{{ $loop->even ? '#fdfaff' : '#ffffff' }}; border-bottom:1px solid #e5e7eb;">
            <td style="padding:9px 12px; color:#111827; border-left:1px solid #e5e7eb; border-right:1px solid #e5e7eb;">{{ $moisLabel }}</td>
            <td style="padding:9px 12px; text-align:center; color:#374151; border-right:1px solid #e5e7eb;">{{ $item['count'] }}</td>
            <td style="padding:9px 12px; text-align:right; color:#111827; font-weight:bold; border-right:1px solid #e5e7eb;">{{ number_format((float)$item['volume'],2,',',' ') }}</td>
        </tr>
        @endforeach
    </tbody>
</table>

{{-- NOTE BAS DE PAGE --}}
<table style="width:100%; border-collapse:collapse; margin-top:10px;">
    <tr>
        <td style="width:4px; background-color:#5a0661;"></td>
        <td style="background-color:#f9fafb; border:1px solid #e5e7eb; border-left:none; padding:12px 15px; font-size:8pt; color:#374151; line-height:1.5;">
            <strong>Observations :</strong> Ces statistiques sont calculées sur la base des activités pédagogiques enregistrées et validées dans le système GAAP-UVCI pour la période sélectionnée.
        </td>
    </tr>
</table>

</body>
</html>
