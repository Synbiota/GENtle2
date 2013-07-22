var cd = { // Common data, filled by loadBaseData()
	"restriction_enzymes":[
		{"name":"BspMI","seq":"ACCTGC","cut":1,"offset":4},
		{"name":"EcoNI","seq":"CCTNNNNNAGG","cut":1,"offset":1},
		{"name":"BalI","seq":"TGGCCA","cut":1,"offset":0},
		{"name":"AsuII","seq":"TTCGAA","cut":1,"offset":2},
		{"name":"BamHI","seq":"GGATCC","cut":1,"offset":4},
		{"name":"AvaI","seq":"CYCGRG","cut":1,"offset":4},
		{"name":"SmaI","seq":"CCCGGG","cut":1,"offset":0},
		{"name":"XmaI","seq":"CCCGGG","cut":1,"offset":4},
		{"name":"EcoRI","seq":"GAATTC","cut":1,"offset":4},
		{"name":"TthI","seq":"GACNNNGTC","cut":1,"offset":1},
		{"name":"AatII","seq":"GACGTC","cut":5,"offset":-4},
		{"name":"PstI","seq":"CTGCAG","cut":5,"offset":-4},
		{"name":"Eco31","seq":"GGTCTC","cut":1,"offset":4},
		{"name":"AlwNI","seq":"CAGNNNCTG","cut":4,"offset":-3},
		{"name":"PflMI","seq":"CCANNNNNTGG","cut":4,"offset":-3},
		{"name":"MluI","seq":"ACGCGT","cut":1,"offset":4},
		{"name":"BstEII","seq":"GGTNACC","cut":1,"offset":5},
		{"name":"ApaI","seq":"GGGCCC","cut":5,"offset":-4},
		{"name":"BanII","seq":"GRGCYC","cut":5,"offset":-4},
		{"name":"BssHII","seq":"GCGCGC","cut":1,"offset":4},
		{"name":"EcoRV","seq":"GATATC","cut":1,"offset":0},
		{"name":"HpaI","seq":"GTTAAC","cut":1,"offset":0},
		{"name":"BbeI","seq":"GGCGCC","cut":5,"offset":-4},
		{"name":"Eco78","seq":"GGCGCC","cut":1,"offset":0},
		{"name":"NarI","seq":"GGCGCC","cut":1,"offset":2},
		{"name":"SauI","seq":"CCTNAGG","cut":1,"offset":3},
		{"name":"DsaI","seq":"CCRYGG","cut":1,"offset":4},
		{"name":"AatI","seq":"AGGCCT","cut":0,"offset":0},
		{"name":"AbrI","seq":"CTCGAG","cut":0,"offset":4},
		{"name":"AccEBI","seq":"GGATCC","cut":0,"offset":4},
		{"name":"AccI","seq":"GTMKAC","cut":1,"offset":2},
		{"name":"AccII","seq":"CGCG","cut":0,"offset":0},
		{"name":"AccIII","seq":"TCCGGA","cut":0,"offset":4},
		{"name":"AcyI","seq":"GRCGYC","cut":0,"offset":2},
		{"name":"AeuI","seq":"CCWGG","cut":0,"offset":1},
		{"name":"AflI","seq":"GGWCC","cut":0,"offset":3},
		{"name":"AflII","seq":"CTTAAG","cut":1,"offset":4},
		{"name":"AflIII","seq":"ACRYGT","cut":1,"offset":4},
		{"name":"AhaI","seq":"CCSGG","cut":0,"offset":1},
		{"name":"AhaII","seq":"GRCGYC","cut":1,"offset":2},
		{"name":"AhaIII","seq":"TTTAAA","cut":0,"offset":0},
		{"name":"AitI","seq":"AGCGCT","cut":0,"offset":0},
		{"name":"AliAJI","seq":"CTGCAG","cut":4,"offset":-4},
		{"name":"AliI","seq":"GGATCC","cut":0,"offset":4},
		{"name":"AluI","seq":"AGCT","cut":1,"offset":0},
		{"name":"AlwI","seq":"GGATC","cut":1,"offset":1},
		{"name":"AlwXI","seq":"GCAGC","cut":0,"offset":4},
		{"name":"AocI","seq":"CCTNAGG","cut":0,"offset":3},
		{"name":"AocII","seq":"GDGCHC","cut":4,"offset":-4},
		{"name":"AorI","seq":"CCWGG","cut":0,"offset":1},
		{"name":"AosI","seq":"TGCGCA","cut":0,"offset":0},
		{"name":"AosII","seq":"GRCGYC","cut":0,"offset":2},
		{"name":"ApaLI","seq":"GTGCAC","cut":1,"offset":4},
		{"name":"ApyI","seq":"CCWGG","cut":0,"offset":1},
		{"name":"AquI","seq":"CYCGRG","cut":0,"offset":4},
		{"name":"AseI","seq":"ATTAAT","cut":1,"offset":2},
		{"name":"AseII","seq":"CCSGG","cut":0,"offset":1},
		{"name":"Asp700","seq":"GAANNNNTTC","cut":0,"offset":0},
		{"name":"Asp718","seq":"GGTACC","cut":1,"offset":4},
		{"name":"AspAI","seq":"GGTNACC","cut":0,"offset":5},
		{"name":"AspHI","seq":"GWGCWC","cut":4,"offset":-4},
		{"name":"AstWI","seq":"GRCGYC","cut":0,"offset":2},
		{"name":"AsuI","seq":"GGNCC","cut":0,"offset":3},
		{"name":"AsuIII","seq":"GRCGYC","cut":0,"offset":2},
		{"name":"AtuBI","seq":"CCWGG","cut":0,"offset":1},
		{"name":"AvaII","seq":"GGWCC","cut":1,"offset":3},
		{"name":"AvaIII","seq":"ATGCAT","cut":4,"offset":-4},
		{"name":"AviII","seq":"TGCGCA","cut":0,"offset":0},
		{"name":"AvrII","seq":"CCTAGG","cut":1,"offset":4},
		{"name":"AxyI","seq":"CCTNAGG","cut":0,"offset":3},
		{"name":"Bac36","seq":"GGNCC","cut":0,"offset":3},
		{"name":"BamNxI","seq":"GGWCC","cut":0,"offset":3},
		{"name":"BanI","seq":"GGYRCC","cut":1,"offset":4},
		{"name":"BanIII","seq":"ATCGAT","cut":0,"offset":2},
		{"name":"BavI","seq":"CAGCTG","cut":0,"offset":0},
		{"name":"BbiII","seq":"GRCGYC","cut":0,"offset":2},
		{"name":"BbvI","seq":"GCAGC","cut":1,"offset":4},
		{"name":"BbvII","seq":"GAAGAC","cut":1,"offset":4},
		{"name":"Bce243I","seq":"GATC","cut":0,"offset":4},
		{"name":"BceRI","seq":"CGCG","cut":0,"offset":0},
		{"name":"BclI","seq":"TGATCA","cut":1,"offset":4},
		{"name":"BcmI","seq":"ATCGAT","cut":0,"offset":2},
		{"name":"BcnI","seq":"CCSGG","cut":0,"offset":1},
		{"name":"BepI","seq":"CGCG","cut":0,"offset":0},
		{"name":"BglI","seq":"GCCNNNNNGGC","cut":4,"offset":-3},
		{"name":"BglII","seq":"AGATCT","cut":1,"offset":4},
		{"name":"BinI","seq":"GGATC","cut":0,"offset":1},
		{"name":"BluI","seq":"CTCGAG","cut":0,"offset":4},
		{"name":"Bme216I","seq":"GGWCC","cut":0,"offset":3},
		{"name":"BscI","seq":"ATCGAT","cut":0,"offset":2},
		{"name":"BsmI","seq":"GAATGC","cut":3,"offset":-2},
		{"name":"Bsp105I","seq":"GATC","cut":0,"offset":4},
		{"name":"Bsp106I","seq":"ATCGAT","cut":0,"offset":2},
		{"name":"Bsp12","seq":"GDGCHC","cut":5,"offset":-4},
		{"name":"Bsp211I","seq":"GGCC","cut":0,"offset":0},
		{"name":"Bsp63I","seq":"CTGCAG","cut":4,"offset":-4},
		{"name":"Bsp67I","seq":"GATC","cut":0,"offset":4},
		{"name":"BspAI","seq":"GATC","cut":0,"offset":4},
		{"name":"BspBI","seq":"CTGCAG","cut":4,"offset":-4},
		{"name":"BspBII","seq":"GGNCC","cut":0,"offset":3},
		{"name":"BspHI","seq":"TCATGA","cut":1,"offset":4},
		{"name":"BspMII","seq":"TCCGGA","cut":1,"offset":4},
		{"name":"BspNI","seq":"CCWGG","cut":0,"offset":1},
		{"name":"BspRI","seq":"GGCC","cut":0,"offset":0},
		{"name":"BspXI","seq":"ATCGAT","cut":0,"offset":2},
		{"name":"BspXII","seq":"TGATCA","cut":0,"offset":4},
		{"name":"BsrI","seq":"ACTGG","cut":3,"offset":-2},
		{"name":"BstBI","seq":"TTCGAA","cut":0,"offset":2},
		{"name":"BstFI","seq":"AAGCTT","cut":0,"offset":4},
		{"name":"BstGII","seq":"CCWGG","cut":0,"offset":1},
		{"name":"BstI","seq":"GGATCC","cut":0,"offset":4},
		{"name":"BstNI","seq":"CCWGG","cut":1,"offset":1},
		{"name":"BstPI","seq":"GGTNACC","cut":0,"offset":5},
		{"name":"BstSI","seq":"CYCGRG","cut":0,"offset":4},
		{"name":"BstUI","seq":"CGCG","cut":0,"offset":0},
		{"name":"BstXI","seq":"CCANNNNNNTGG","cut":5,"offset":-4},
		{"name":"BstYI","seq":"RGATCY","cut":0,"offset":4},
		{"name":"Bsu36","seq":"CCTNAGG","cut":0,"offset":3},
		{"name":"BsuRI","seq":"GGCC","cut":0,"offset":0},
		{"name":"BvuI","seq":"GRGCYC","cut":4,"offset":-4},
		{"name":"CauI","seq":"GGWCC","cut":0,"offset":3},
		{"name":"CauII","seq":"CCSGG","cut":0,"offset":1},
		{"name":"CcrI","seq":"CTCGAG","cut":0,"offset":4},
		{"name":"CelII","seq":"GCTNAGC","cut":0,"offset":3},
		{"name":"CeqI","seq":"GATATC","cut":0,"offset":0},
		{"name":"CflI","seq":"CTGCAG","cut":4,"offset":-4},
		{"name":"CfoI","seq":"GCGC","cut":2,"offset":-2},
		{"name":"Cfr10","seq":"RCCGGY","cut":1,"offset":4},
		{"name":"Cfr13","seq":"GGNCC","cut":0,"offset":3},
		{"name":"Cfr6I","seq":"CAGCTG","cut":0,"offset":0},
		{"name":"Cfr9I","seq":"CCCGGG","cut":0,"offset":4},
		{"name":"CfrA4I","seq":"CTGCAG","cut":4,"offset":-4},
		{"name":"CfrI","seq":"YGGCCR","cut":0,"offset":4},
		{"name":"CfuI","seq":"GATC","cut":0,"offset":0},
		{"name":"ClaI","seq":"ATCGAT","cut":1,"offset":2},
		{"name":"CltI","seq":"GGCC","cut":0,"offset":0},
		{"name":"CpfI","seq":"GATC","cut":0,"offset":4},
		{"name":"CscI","seq":"CCGCGG","cut":2,"offset":-2},
		{"name":"CthII","seq":"CCWGG","cut":0,"offset":1},
		{"name":"CviAI","seq":"GATC","cut":0,"offset":4},
		{"name":"CviBI","seq":"GANTC","cut":0,"offset":3},
		{"name":"CviJI","seq":"RGCY","cut":1,"offset":0},
		{"name":"CviQI","seq":"GTAC","cut":0,"offset":2},
		{"name":"CvnI","seq":"CCTNAGG","cut":0,"offset":3},
		{"name":"DdeI","seq":"CTNAG","cut":1,"offset":3},
		{"name":"DpnI","seq":"GATC","cut":1,"offset":0},
		{"name":"DraI","seq":"TTTAAA","cut":1,"offset":0},
		{"name":"DraII","seq":"RGGNCCY","cut":1,"offset":3},
		{"name":"DraIII","seq":"CACNNNGTG","cut":4,"offset":-3},
		{"name":"DsaII","seq":"GGCC","cut":0,"offset":0},
		{"name":"EaeI","seq":"YGGCCR","cut":1,"offset":4},
		{"name":"EagI","seq":"CGGCCG","cut":0,"offset":4},
		{"name":"EagMI","seq":"GGWCC","cut":0,"offset":3},
		{"name":"EcaI","seq":"GGTNACC","cut":0,"offset":5},
		{"name":"EclJI","seq":"CGATCG","cut":2,"offset":-2},
		{"name":"Eco105","seq":"TACGTA","cut":0,"offset":0},
		{"name":"Eco14","seq":"CCWWGG","cut":0,"offset":4},
		{"name":"Eco22","seq":"ATGCAT","cut":4,"offset":-4},
		{"name":"Eco32","seq":"GATATC","cut":0,"offset":0},
		{"name":"Eco47","seq":"GGWCC","cut":0,"offset":3},
		{"name":"Eco47-3","seq":"AGCGCT","cut":1,"offset":0},
		{"name":"Eco52","seq":"CGGCCG","cut":0,"offset":4},
		{"name":"Eco57","seq":"CTGAAG","cut":3,"offset":-2},
		{"name":"Eco72I","seq":"CACGTG","cut":0,"offset":0},
		{"name":"Eco8","seq":"AAGCTT","cut":0,"offset":4},
		{"name":"Eco81","seq":"CCTNAGG","cut":0,"offset":3},
		{"name":"EcoO109","seq":"RGGNCCY","cut":0,"offset":3},
		{"name":"EcoO65I","seq":"GGTNACC","cut":0,"offset":5},
		{"name":"EcoRII","seq":"CCWGG","cut":1,"offset":5},
		{"name":"EcoT14I","seq":"CCWWGG","cut":0,"offset":4},
		{"name":"EcoT22I","seq":"ATGCAT","cut":4,"offset":-4},
		{"name":"EcoVIII","seq":"AAGCTT","cut":0,"offset":4},
		{"name":"ErpI","seq":"GGWCC","cut":0,"offset":3},
		{"name":"EspI","seq":"GCTNAGC","cut":1,"offset":3},
		{"name":"FbrI","seq":"GCNGC","cut":0,"offset":1},
		{"name":"FdiI","seq":"GGWCC","cut":0,"offset":3},
		{"name":"FdiII","seq":"TGCGCA","cut":0,"offset":0},
		{"name":"Fnu4H","seq":"GCNGC","cut":1,"offset":1},
		{"name":"FnuAI","seq":"GANTC","cut":0,"offset":3},
		{"name":"FnuCI","seq":"GATC","cut":0,"offset":4},
		{"name":"FnuDI","seq":"GGCC","cut":0,"offset":0},
		{"name":"FnuDII","seq":"CGCG","cut":0,"offset":0},
		{"name":"FnuDIII","seq":"GCGC","cut":2,"offset":-2},
		{"name":"FnuEI","seq":"GATC","cut":0,"offset":4},
		{"name":"FokI","seq":"GGATG","cut":1,"offset":4},
		{"name":"FspI","seq":"TGCGCA","cut":1,"offset":0},
		{"name":"FspII","seq":"TTCGAA","cut":0,"offset":2},
		{"name":"FspMSI","seq":"GGWCC","cut":0,"offset":3},
		{"name":"GalI","seq":"CCGCGG","cut":2,"offset":-2},
		{"name":"GceGLI","seq":"CCGCGG","cut":2,"offset":-2},
		{"name":"GceI","seq":"CCGCGG","cut":2,"offset":-2},
		{"name":"GdiI","seq":"AGGCCT","cut":0,"offset":0},
		{"name":"GdiII","seq":"CGGCCR","cut":1,"offset":4},
		{"name":"GsuI","seq":"CTGGAG","cut":3,"offset":-2},
		{"name":"HacI","seq":"GATC","cut":0,"offset":4},
		{"name":"HaeI","seq":"WGGCCW","cut":1,"offset":0},
		{"name":"HaeII","seq":"RGCGCY","cut":5,"offset":-4},
		{"name":"HaeIII","seq":"GGCC","cut":1,"offset":0},
		{"name":"HapII","seq":"CCGG","cut":0,"offset":2},
		{"name":"HgaI","seq":"GACGC","cut":1,"offset":5},
		{"name":"HgiAI","seq":"GWGCWC","cut":5,"offset":-4},
		{"name":"HgiBI","seq":"GGWCC","cut":0,"offset":3},
		{"name":"HgiCI","seq":"GGYRCC","cut":0,"offset":4},
		{"name":"HgiCII","seq":"GGWCC","cut":0,"offset":3},
		{"name":"HgiCIII","seq":"GTCGAC","cut":0,"offset":4},
		{"name":"HgiDI","seq":"GRCGYC","cut":0,"offset":2},
		{"name":"HgiDII","seq":"GTCGAC","cut":0,"offset":4},
		{"name":"HgiEI","seq":"GGWCC","cut":0,"offset":3},
		{"name":"HgiGI","seq":"GRCGYC","cut":0,"offset":2},
		{"name":"HgiHI","seq":"GGYRCC","cut":0,"offset":4},
		{"name":"HgiHII","seq":"GRCGYC","cut":0,"offset":2},
		{"name":"HgiHIII","seq":"GGWCC","cut":0,"offset":3},
		{"name":"HgiJI","seq":"GGWCC","cut":0,"offset":3},
		{"name":"HgiJII","seq":"GRGCYC","cut":4,"offset":-4},
		{"name":"HhaI","seq":"GCGC","cut":3,"offset":-2},
		{"name":"HhaII","seq":"GANTC","cut":0,"offset":3},
		{"name":"HincII","seq":"GTYRAC","cut":1,"offset":0},
		{"name":"HindII","seq":"GTYRAC","cut":0,"offset":0},
		{"name":"HindIII","seq":"AAGCTT","cut":1,"offset":4},
		{"name":"HinfI","seq":"GANTC","cut":1,"offset":3},
		{"name":"HinJCI","seq":"GTYRAC","cut":0,"offset":0},
		{"name":"HinP1I","seq":"GCGC","cut":0,"offset":2},
		{"name":"HinPI","seq":"GCGC","cut":1,"offset":2},
		{"name":"HpaII","seq":"CCGG","cut":1,"offset":2},
		{"name":"HphI","seq":"GGTGA","cut":2,"offset":-1},
		{"name":"HsuI","seq":"AAGCTT","cut":0,"offset":4},
		{"name":"KoxI","seq":"GGTNACC","cut":0,"offset":5},
		{"name":"KoxII","seq":"GRGCYC","cut":4,"offset":-4},
		{"name":"KpnI","seq":"GGTACC","cut":5,"offset":-4},
		{"name":"Ksp63","seq":"CTCTTC","cut":1,"offset":3},
		{"name":"LspI","seq":"TTCGAA","cut":0,"offset":2},
		{"name":"MaeI","seq":"CTAG","cut":1,"offset":2},
		{"name":"MaeII","seq":"ACGT","cut":1,"offset":2},
		{"name":"MaeIII","seq":"GTNAC","cut":1,"offset":5},
		{"name":"MboI","seq":"GATC","cut":0,"offset":4},
		{"name":"MboII","seq":"GAAGA","cut":2,"offset":-1},
		{"name":"MflI","seq":"RGATCY","cut":0,"offset":4},
		{"name":"MlaI","seq":"TTCGAA","cut":0,"offset":2},
		{"name":"MltI","seq":"AGCT","cut":0,"offset":0},
		{"name":"MmeI","seq":"TCCRAC","cut":3,"offset":-2},
		{"name":"MnlI","seq":"CCTC","cut":1,"offset":0},
		{"name":"MnoI","seq":"CCGG","cut":0,"offset":2},
		{"name":"MroI","seq":"TCCGGA","cut":0,"offset":4},
		{"name":"MseI","seq":"TTAA","cut":1,"offset":2},
		{"name":"Msp67I","seq":"CCNGG","cut":0,"offset":1},
		{"name":"MspI","seq":"CCGG","cut":0,"offset":2},
		{"name":"MstI","seq":"TGCGCA","cut":0,"offset":0},
		{"name":"MstII","seq":"CCTNAGG","cut":0,"offset":3},
		{"name":"MvaI","seq":"CCWGG","cut":0,"offset":1},
		{"name":"MvnI","seq":"CGCG","cut":0,"offset":0},
		{"name":"NaeI","seq":"GCCGGC","cut":1,"offset":0},
		{"name":"NblI","seq":"CGATCG","cut":2,"offset":-2},
		{"name":"NciI","seq":"CCSGG","cut":1,"offset":1},
		{"name":"NcoI","seq":"CCATGG","cut":1,"offset":4},
		{"name":"NdaI","seq":"GGCGCC","cut":0,"offset":2},
		{"name":"NdeI","seq":"CATATG","cut":1,"offset":2},
		{"name":"NdeII","seq":"GATC","cut":0,"offset":4},
		{"name":"NgoPII","seq":"GGCC","cut":0,"offset":0},
		{"name":"NgoPIII","seq":"CCGCGG","cut":2,"offset":-2},
		{"name":"NheI","seq":"GCTAGC","cut":1,"offset":4},
		{"name":"NlaII","seq":"GATC","cut":0,"offset":4},
		{"name":"NlaIII","seq":"CATG","cut":5,"offset":-4},
		{"name":"NlaIV","seq":"GGNNCC","cut":1,"offset":0},
		{"name":"NmeCI","seq":"GATC","cut":0,"offset":4},
		{"name":"NopI","seq":"GTCGAC","cut":0,"offset":4},
		{"name":"NotI","seq":"GCGGCCGC","cut":1,"offset":4},
		{"name":"NphI","seq":"GATC","cut":0,"offset":4},
		{"name":"NruI","seq":"TCGCGA","cut":1,"offset":0},
		{"name":"NsiCI","seq":"GATATC","cut":0,"offset":0},
		{"name":"NsiI","seq":"ATGCAT","cut":5,"offset":-4},
		{"name":"NspBII","seq":"CMGCKG","cut":1,"offset":0},
		{"name":"NspHI","seq":"RCATGY","cut":5,"offset":-4},
		{"name":"NspI","seq":"RCATGY","cut":4,"offset":-4},
		{"name":"NspII","seq":"GDGCHC","cut":4,"offset":-4},
		{"name":"NspIII","seq":"CYCGRG","cut":0,"offset":4},
		{"name":"NspIV","seq":"GGNCC","cut":0,"offset":3},
		{"name":"NspMACI","seq":"AGATCT","cut":0,"offset":4},
		{"name":"NspSAI","seq":"CYCGRG","cut":0,"offset":4},
		{"name":"NspSAII","seq":"GGTNACC","cut":0,"offset":5},
		{"name":"NspSAIV","seq":"GGATCC","cut":0,"offset":4},
		{"name":"NspV","seq":"TTCGAA","cut":0,"offset":2},
		{"name":"NunII","seq":"GGCGCC","cut":0,"offset":2},
		{"name":"PaeAI","seq":"CCGCGG","cut":2,"offset":-2},
		{"name":"PaeI","seq":"GCATGC","cut":4,"offset":-4},
		{"name":"PaeR7","seq":"CTCGAG","cut":0,"offset":4},
		{"name":"PalI","seq":"GGCC","cut":0,"offset":0},
		{"name":"PanI","seq":"CTCGAG","cut":0,"offset":4},
		{"name":"PleI","seq":"GAGTC","cut":1,"offset":1},
		{"name":"Pma44I","seq":"CTGCAG","cut":4,"offset":-4},
		{"name":"PmaCI","seq":"CACGTG","cut":1,"offset":0},
		{"name":"PovI","seq":"TGATCA","cut":0,"offset":4},
		{"name":"PpuMI","seq":"RGGWCCY","cut":1,"offset":3},
		{"name":"PspI","seq":"GGNCC","cut":0,"offset":3},
		{"name":"PssI","seq":"RGGNCCY","cut":4,"offset":-3},
		{"name":"PvuI","seq":"CGATCG","cut":3,"offset":-2},
		{"name":"PvuII","seq":"CAGCTG","cut":1,"offset":0},
		{"name":"RsaI","seq":"GTAC","cut":1,"offset":0},
		{"name":"RshI","seq":"CGATCG","cut":2,"offset":-2},
		{"name":"RspI","seq":"CGATCG","cut":2,"offset":-2},
		{"name":"RspXI","seq":"TCATGA","cut":0,"offset":4},
		{"name":"RsrI","seq":"GAATTC","cut":0,"offset":4},
		{"name":"RsrII","seq":"CGGWCCG","cut":1,"offset":3},
		{"name":"SacI","seq":"GAGCTC","cut":5,"offset":-4},
		{"name":"SacII","seq":"CCGCGG","cut":3,"offset":-2},
		{"name":"SalI","seq":"GTCGAC","cut":1,"offset":4},
		{"name":"SalPI","seq":"CTGCAG","cut":4,"offset":-4},
		{"name":"Sau3239","seq":"CTCGAG","cut":0,"offset":4},
		{"name":"Sau3A","seq":"GATC","cut":1,"offset":4},
		{"name":"Sau96","seq":"GGNCC","cut":1,"offset":3},
		{"name":"SauBMKI","seq":"GCCGGC","cut":0,"offset":0},
		{"name":"Sbo13","seq":"TCGCGA","cut":0,"offset":0},
		{"name":"ScaI","seq":"AGTACT","cut":1,"offset":0},
		{"name":"SciI","seq":"CTCGAG","cut":1,"offset":0},
		{"name":"SciNI","seq":"GCGC","cut":0,"offset":2},
		{"name":"ScrFI","seq":"CCNGG","cut":1,"offset":1},
		{"name":"SduI","seq":"GDGCHC","cut":4,"offset":-4},
		{"name":"SecI","seq":"CCNNGG","cut":1,"offset":4},
		{"name":"SexI","seq":"CTCGAG","cut":0,"offset":4},
		{"name":"SfaI","seq":"GGCC","cut":0,"offset":0},
		{"name":"SfaNI","seq":"GCATC","cut":1,"offset":4},
		{"name":"SfiI","seq":"GGCCNNNNNGGCC","cut":4,"offset":-3},
		{"name":"SflI","seq":"CTGCAG","cut":4,"offset":-4},
		{"name":"SinI","seq":"GGWCC","cut":0,"offset":3},
		{"name":"SlaI","seq":"CTCGAG","cut":0,"offset":4},
		{"name":"SnaBI","seq":"TACGTA","cut":1,"offset":0},
		{"name":"SnoI","seq":"GTGCAC","cut":0,"offset":4},
		{"name":"SpeI","seq":"ACTAGT","cut":1,"offset":4},
		{"name":"SphI","seq":"GCATGC","cut":5,"offset":-4},
		{"name":"SplI","seq":"CGTACG","cut":1,"offset":4},
		{"name":"SsoI","seq":"GAATTC","cut":0,"offset":4},
		{"name":"SsoII","seq":"CCNGG","cut":1,"offset":5},
		{"name":"SspI","seq":"AATATT","cut":1,"offset":0},
		{"name":"SstI","seq":"GAGCTC","cut":4,"offset":-4},
		{"name":"SstII","seq":"CCGCGG","cut":2,"offset":-2},
		{"name":"SthI","seq":"GGTACC","cut":0,"offset":4},
		{"name":"StuI","seq":"AGGCCT","cut":1,"offset":0},
		{"name":"StyI","seq":"CCWWGG","cut":1,"offset":4},
		{"name":"SuaI","seq":"GGCC","cut":0,"offset":0},
		{"name":"TaqI","seq":"TCGA","cut":1,"offset":2},
		{"name":"TaqXI","seq":"CCWGG","cut":0,"offset":1},
		{"name":"ThaI","seq":"CGCG","cut":1,"offset":0},
		{"name":"TthHB","seq":"TCGA","cut":0,"offset":2},
		{"name":"TthII","seq":"CAARCA","cut":3,"offset":-2},
		{"name":"VneI","seq":"GTGCAC","cut":0,"offset":4},
		{"name":"VspI","seq":"ATTAAT","cut":0,"offset":2},
		{"name":"XbaI","seq":"TCTAGA","cut":1,"offset":4},
		{"name":"XcaI","seq":"GTATAC","cut":1,"offset":0},
		{"name":"XciI","seq":"GTCGAC","cut":0,"offset":4},
		{"name":"XcyI","seq":"CCCGGG","cut":0,"offset":4},
		{"name":"XhoI","seq":"CTCGAG","cut":1,"offset":4},
		{"name":"XhoII","seq":"RGATCY","cut":1,"offset":4},
		{"name":"XmaIII","seq":"CGGCCG","cut":1,"offset":4},
		{"name":"XmnI","seq":"GAANNNNTTC","cut":1,"offset":0},
		{"name":"XorII","seq":"CGATCG","cut":2,"offset":-2},
		{"name":"XpaI","seq":"CTCGAG","cut":0,"offset":4},
		{"name":"YenI","seq":"CTGCAG","cut":4,"offset":-4},
		{"name":"ZanI","seq":"CCWGG","cut":0,"offset":1},
		{"name":"BpiI","seq":"GAAGACNNNNNN","cut":6,"offset":4},
		{"name":"Mva1269I","seq":"GAATGCN","cut":7,"offset":-2},
		{"name":"xagI","seq":"CCTNNNNNAGG","cut":5,"offset":1}
	],
	"proteases":[
		{"name":"*Factor Xa","seq":"AFGILTVM,DE,G,R|*","note":"","cut":0},
		{"name":"*Proline-endopeptidase","seq":"HKR,P|!P","note":"test","cut":1},
		{"name":"*Proteinase K","seq":"AEFILTVWY|*","note":"","cut":0},
		{"name":"*Staphylococcal peptidase I","seq":"!E|E","note":"","cut":0},
		{"name":"*Thermolysin","seq":"!DE|AFILMV","note":"","cut":0},
		{"name":"*Thrombin","seq":"G,R|G","note":"","cut":1},
		{"name":"*Thrombin (2)","seq":"AFGILTVM,AFGILTVW,P,R|!DE,!DE","note":"","cut":3},
		{"name":"*Hydroxylamine","seq":"N|G","note":"","cut":0},
		{"name":"*Iodosobenzoic acid","seq":"W|*","note":"","cut":0},
		{"name":"*LysC","seq":"K|*","note":"","cut":0},
		{"name":"*NTCB","seq":"*|C","note":"","cut":0},
		{"name":"*Arg-C","seq":"R|*","note":"","cut":0},
		{"name":"*Arg-N","seq":"D|*","note":"Endopeptidase","cut":0},
		{"name":"*BNPS","seq":"W|*","note":"BNPS-Skatole","cut":0},
		{"name":"*GranzymeB","seq":"I,E,P,D|*","note":"","cut":3},
		{"name":"*Glutamyl","seq":"E|*","note":"Endopeptidase","cut":0},
		{"name":"*Formic acid","seq":"D|P","note":"","cut":0},
		{"name":"*CNBr","seq":"M|*","note":"","cut":0},
		{"name":"*Enterokinase","seq":"DN,DN,DN,K|*","note":"","cut":3},
		{"name":"*Clostripain","seq":"R|*","note":"","cut":5357847},
		{"name":"*Caspase 1","seq":"WH,E,H,D|*","note":"","cut":3},
		{"name":"*Caspase 2","seq":"D,V,A,D|*","note":"","cut":3},
		{"name":"*Caspase 3","seq":"D,M,Q,D|*","note":"","cut":3},
		{"name":"*Caspase 4","seq":"L,E,V,D|*","note":"","cut":3},
		{"name":"*Caspase 5","seq":"LW,E,H,D|*","note":"","cut":3},
		{"name":"*Caspase 6","seq":"V,E,HI,D|*","note":"","cut":3},
		{"name":"*Caspase 7","seq":"D,E,V,D|*","note":"","cut":3},
		{"name":"*Caspase 8","seq":"IL,E,T,D|*","note":"","cut":3},
		{"name":"*Caspase 9","seq":"L,E,H,D|*","note":"","cut":3},
		{"name":"*Caspase 10","seq":"I,E,A,D|*","note":"","cut":3},
		{"name":"*Chymotrypsin H (1)","seq":"FY|!P","note":"","cut":5357847},
		{"name":"*Chymotrypsin H (2)","seq":"W|!MP","note":"","cut":5357847},
		{"name":"*Chymotrypsin L (1)","seq":"FLY|!P","note":"","cut":0},
		{"name":"*Chymotrypsin L (2)","seq":"W|!MP","note":"","cut":5357847},
		{"name":"*Chymotrypsin L (3)","seq":"M|!PY","note":"","cut":5357847},
		{"name":"*Chymotrypsin L (4)","seq":"H|!DMPT","note":"","cut":5357847},
		{"name":"*Pepsin pH1.3 (1)","seq":"!HKR,!P,!R|FLWY,!P","note":"","cut":2},
		{"name":"*Pepsin pH1.3 (2)","seq":"!HKR,!P,FLWY|*,!P","note":"","cut":2},
		{"name":"*Pepsin pH>2 (1)","seq":"!HKR,!P,!R|FL,!P","note":"","cut":2},
		{"name":"*Pepsin pH>2 (2)","seq":"!HKR,!P,FL|*,!P","note":"","cut":2}
	],
	"bases2iupac":{
		"A":"A",
		"C":"C",
		"G":"G",
		"T":"T",
		"AG":"R",
		"CT":"Y",
		"AC":"M",
		"GT":"K",
		"AT":"W",
		"CG":"S",
		"CGT":"B",
		"AGT":"D",
		"ACT":"H",
		"ACG":"V",
		"ACGT":"N"
	},
	"aa":[
		{ "long":"Ala" , "short":"A" , "codons": [ "GCT", "GCC", "GCA", "GCG" ] } ,
		{ "long":"Leu" , "short":"L" , "codons": [ "TTA", "TTG", "CTT", "CTC", "CTA", "CTG" ] } ,
		{ "long":"Arg" , "short":"R" , "codons": [ "CGT", "CGC", "CGA", "CGG", "AGA", "AGG" ] } ,
		{ "long":"Lys" , "short":"K" , "codons": [ "AAA", "AAG" ] } ,
		{ "long":"Asn" , "short":"N" , "codons": [ "AAT", "AAC" ] } ,
		{ "long":"Met" , "short":"M" , "codons": [ "ATG" ] } ,
		{ "long":"Asp" , "short":"D" , "codons": [ "GAT", "GAC" ] } ,
		{ "long":"Phe" , "short":"F" , "codons": [ "TTT", "TTC" ] } ,
		{ "long":"Cys" , "short":"C" , "codons": [ "TGT", "TGC" ] } ,
		{ "long":"Pro" , "short":"P" , "codons": [ "CCT", "CCC", "CCA", "CCG" ] } ,
		{ "long":"Gln" , "short":"Q" , "codons": [ "CAA", "CAG" ] } ,
		{ "long":"Ser" , "short":"S" , "codons": [ "TCT", "TCC", "TCA", "TCG", "AGT", "AGC" ] } ,
		{ "long":"Glu" , "short":"E" , "codons": [ "GAA", "GAG" ] } ,
		{ "long":"Thr" , "short":"T" , "codons": [ "ACT", "ACC", "ACA", "ACG" ] } ,
		{ "long":"Gly" , "short":"G" , "codons": [ "GGT", "GGC", "GGA", "GGG" ] } ,
		{ "long":"Trp" , "short":"W" , "codons": [ "TGG" ] } ,
		{ "long":"His" , "short":"H" , "codons": [ "CAT", "CAC" ] } ,
		{ "long":"Tyr" , "short":"Y" , "codons": [ "TAT", "TAC" ] } ,
		{ "long":"Ile" , "short":"I" , "codons": [ "ATT", "ATC", "ATA" ] } ,
		{ "long":"Val" , "short":"V" , "codons": [ "GTT", "GTC", "GTA", "GTG" ] } ,
		{ "long":"STP" , "short":"X" , "codons": [ "TAG", "TGA", "TAA" ] }
	] ,
	"metakeys" : {
		'CMD' : 8 ,
		'SHIFT' : 4 ,
		'ALT' : 2 ,
		'CTRL' : 1
   	} ,
   	"feature_types" : { //colours determined in main.css, .feat_misc
		'misc' : 			{ 'category':'General',					'annotation_row_offset':0 , 'name':'Misc' } ,
		'note' : 			{ 'category':'General', 				'annotation_row_offset':0 , 'name':'Note' } ,

		'alu_element' : 	{ 'category':'DNA', 'is_main_type':1 , 	'annotation_row_offset':1 , 'name':'Alu element' },
		'cds' : 			{ 'category':'DNA', 'is_main_type':1 , 	'annotation_row_offset':1 , 'name':'Coding sequence' },
		'cre' : 			{ 'category':'DNA', 'is_main_type':1 , 	'annotation_row_offset':1 , 'name':'Cis regulatory element' },
		'crispr' : 			{ 'category':'DNA', 'is_main_type':1 , 	'annotation_row_offset':1 , 'name':'CRISPR' },
		'enhancer' :		{ 'category':'DNA', 'is_main_type':1 , 	'annotation_row_offset':1 , 'name':'Enhancer' },
		'exon' : 			{ 'category':'DNA', 'is_main_type':1 , 	'annotation_row_offset':1 , 'name':'Exon' },
		'gene' : 			{ 'category':'DNA', 					'annotation_row_offset':1 , 'name':'Gene' } ,
		'intron' : 			{ 'category':'DNA', 'is_main_type':1 , 	'annotation_row_offset':1 , 'name':'Intron' },
		'mre' : 			{ 'category':'DNA', 'is_main_type':1 , 	'annotation_row_offset':1 , 'name':'Mobile genetic element' },
		'ori' : 			{ 'category':'DNA', 'is_main_type':1 , 	'annotation_row_offset':1 , 'name':'Replication origin' } ,
		'promoter' : 		{ 'category':'DNA', 'is_main_type':1 , 	'annotation_row_offset':1 , 'name':'Promoter' } ,
		'pseudogene' :		{ 'category':'DNA', 'is_main_type':1 , 	'annotation_row_offset':1 , 'name':'Pseudogene' } ,
		'rbs' : 			{ 'category':'DNA', 'is_main_type':1 , 	'annotation_row_offset':1 , 'name':'Ribosomal binding site' } ,
		'terminator' : 		{ 'category':'DNA', 'is_main_type':1 , 	'annotation_row_offset':1 , 'name':'Terminator' } ,
		'tre' : 			{ 'category':'DNA', 'is_main_type':1 , 	'annotation_row_offset':1 , 'name':'Trans regulatory element' } ,

		'binding_domain' : 	{ 'category':'Protein', 				'annotation_row_offset':2 , 'name':'Binding domain' } ,		
		'peptide' : 		{ 'category':'Protein', 				'annotation_row_offset':2 , 'name':'Peptide' } ,
		'protein_bind' : 	{ 'category':'Protein', 				'annotation_row_offset':2 , 'name':'Protein binding site' } ,
		'protein_domain' : 	{ 'category':'Protein', 				'annotation_row_offset':2 , 'name':'Protein domain' } ,
		'protein_tag' : 	{ 'category':'Protein', 				'annotation_row_offset':2 , 'name':'Protein tag' } ,

		'lncRNA' : 			{ 'category':'RNA', 					'annotation_row_offset':3 , 'name':'lncRNA' } ,
		'miRNA' : 			{ 'category':'RNA', 					'annotation_row_offset':3 , 'name':'miRNA' } ,
		'piRNA' : 			{ 'category':'RNA', 					'annotation_row_offset':3 , 'name':'piRNA' } ,
		'rasiRNA' : 		{ 'category':'RNA', 					'annotation_row_offset':3 , 'name':'rasiRNA' } ,
		'Ribozymes' : 		{ 'category':'RNA', 					'annotation_row_offset':3 , 'name':'Ribozymes' } ,
		'rRNA' : 			{ 'category':'RNA', 					'annotation_row_offset':3 , 'name':'rRNA' } ,
		'siRNA' : 			{ 'category':'RNA', 					'annotation_row_offset':3 , 'name':'siRNA' } ,
		'snoRNA' : 			{ 'category':'RNA', 					'annotation_row_offset':3 , 'name':'snoRNA' } ,
		'snRNA' : 			{ 'category':'RNA', 					'annotation_row_offset':3 , 'name':'snRNA' } ,
		'tmRNA' : 			{ 'category':'RNA', 					'annotation_row_offset':3 , 'name':'tmRNA' } ,
		'tRNA' : 			{ 'category':'RNA', 					'annotation_row_offset':3 , 'name':'tRNA' }

   	}
} ;
