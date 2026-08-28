# Session QR Selection and PDF Printing Design

## Goal

Replace the organizer dashboard’s QR-card grid with a selectable, sortable session list that generates a polished one-session-per-page PDF in a new browser tab.

## Selection and sorting

All sessions are selected initially. Synchronized “All” checkboxes appear above and below the list and show an indeterminate state when only some sessions are selected. Each session row includes its title, speaker, track, and schedule status, with a checkbox controlling inclusion.

The organizer can sort alphabetically, chronologically with unscheduled sessions last, or by track order and session title. The print button displays the selected count and is disabled when no sessions are selected.

## PDF output

The browser generates an A4 portrait PDF using jsPDF and opens the resulting Blob URL in a separate tab. Each selected session gets one page with a large wrapped title, a slightly smaller speaker line, restrained track/schedule context, and a large centered QR code occupying the lower third. QR codes use the public session URL.

When sorting by track and the selected sessions span more than one track, the PDF inserts a full-page divider bearing the track name before each included track. Divider pages are omitted for alphabetical/time sorting and when only one track is represented.

## Architecture

Pure view-model functions own selection-independent sorting, speaker extraction, track grouping, and print-page planning. A PDF adapter consumes the page plan, generates QR images, lays out the pages, creates a Blob URL, and opens it. Keeping planning separate from rendering makes ordering, divider insertion, and page counts deterministic and testable.

## Error handling and accessibility

The new tab is opened immediately on click to avoid popup blocking, then navigated to the generated PDF. If generation fails, the placeholder tab closes and the dashboard shows an error. Native checkbox labels provide large click targets; both “All” controls are synchronized and their indeterminate state is exposed by the checkbox element.

## Testing

Tests cover default all-selected state, select-all behavior, every sorting mode, unscheduled ordering, speaker extraction, track-divider rules, page counts, and PDF page-plan inputs. The final browser-generated PDF will be rendered to images and visually inspected for representative short and long content before merge.
