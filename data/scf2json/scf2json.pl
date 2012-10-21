use strict;

use Bio::SCF;
use JSON::XS;

my $file = shift || die "need input file";

my $output = [];

my $scf = Bio::SCF->new($file);
my $len = $scf->bases_length;

my $max_sample = 0;

for (my $i=0; $i < $len; $i++) {
  my $sample_index = $scf->index($i);
  my ($G,$A,$T,$C) = map { $scf->sample($_,$sample_index) } qw(G A T C);

  $max_sample = $A if $A > $max_sample;
  $max_sample = $C if $C > $max_sample;
  $max_sample = $G if $G > $max_sample;
  $max_sample = $T if $T > $max_sample;
}

for (my $i=0; $i < $len; $i++) {
  my $base = $scf->base($i);
  my $sample_index = $scf->index($i);
  my ($G,$A,$T,$C) = map { $scf->sample($_,$sample_index) } qw(G A T C);

  my $rec = {
    base => $base,
  };

  $rec->{G} = normalize($G) if $G;
  $rec->{A} = normalize($A) if $A;
  $rec->{T} = normalize($T) if $T;
  $rec->{C} = normalize($C) if $C;

  push @$output, $rec;
}

print encode_json($output);



sub normalize {
  my $n = shift;

  return int(100.0 * $n / $max_sample);
}
