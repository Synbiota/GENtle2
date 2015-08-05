# Change log

## develop

* Dave   2015-08-05  Added validation requiring selection of part type when creating RDP part 
* James  2015-08-04  Update error text on someone using a source sequence that is an RDP part, for creating a new RDP part from.
* James  2015-08-04  (dev) Fix issue #231 (invalid sequence attributes stored in localStorage should not prevent GENtle from loading).

## 0.5.0

* James  2015-07-29  Direct RDP part creation through PCR route when sequence >= 80 rather than >= 100
* Dave/Alex  2015-07-27 New 'New sequence' home layout
* Alex  2015-07-24  Added tooltip on home button in navbar
* Alex  2015-07-24  Dual canvas view when designing RDP oligo parts
* James  2015-07-23  Render known RDP edits in better format.
* James  2015-07-23  Lower minimium primer annealing region length for PCR primers from 20 to 12.
* James  2015-07-23  Prefix and suffix short name with RDP sticky end names.
* James  2015-07-23  Sentence case for RDP part type on product view.
* James  2015-07-23  Add Promoter part type to PCR part types.
* James  2015-07-23  Enable RDP oligo part creation for Terminator and RBS.
* Mason  2015-07-22  Changes Products (RDP) to set the default reading frame to +1
* James  2015-07-22  Do not remove start and end bases from non-protein coding PCR "other" RDP parts
* James  2015-07-22  Correctly remove start and end bases from protein coding oligo RDP parts
* James  2015-07-22  Enable RDP oligo part creation for all part types except Terminator and RBS.
* Alex  2015-07-21  Designer now stores available sequences locally. Previous available sequences are loaded automatically when designing a new circuit. Users can clear available sequences.
