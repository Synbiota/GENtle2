# Change log

## develop

* James  2015-08-19  The PCR primer designer (`getPcrPrimerAnnealingRegions` and `getPcrProductAndPrimers`) now accept sequenceModel with stickyEnds.  This is so that extension regions that were previously appended afterwards (and could affect the primer annealing temperatures) can now be appended before hand and taken into consideration with relation to the underlying template DNA the `originalSequenceBases`.
* James  2015-08-14  Persist new RDP part form data across page reloads and view changes.
* Alex/Dave  2015-08-13  Added new RDP part onboarding help dialog

## 0.7.0

* Dave/James  2015-08-14  Changes to new RDP part creation and form:
    * No default RDP Part Type.  Validation requires selecting a part type.
    * Rename 'RDP Orientation' to 'RDP Format' .
    * Remove 'RDP Part name' from form & rename 'RDP Part short name' to 'RDP Part name'
    * Add source file name to 'Description'
    * (For PCR form) Remove PCR parameters
    * Add TTm and Tm for PCR primers.
* James  2015-08-10  Change CDS part type to 'Fusion Protein CDS' and add 'CDS with stop' part type.

## 0.6.2

* James  2015-08-06  Add v3 RDP universal primers (in previous commit: 8f4464ba621d72b7748da623bbe43de11e8f7e20 )
* James  2015-08-06  (dev) Fix issue #234  (Instantiating a valid WipRdpAbstractSequence model logs an error).
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
