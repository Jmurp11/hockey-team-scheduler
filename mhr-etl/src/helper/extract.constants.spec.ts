import * as cheerio from "cheerio";
import { rankingsExtract } from "./extract.constants";
import { element1, element2 } from "../rankings/rankings.constants";
import { parse_html } from "./util";

/**
 * MHR renders two table shapes. For 9u/10u the leading rank column is absent,
 * so every subsequent column shifts left by one. Reading the wrong shape does
 * not crash — it silently writes the record into the rating column and so on —
 * which is exactly why this is pinned by a fixture.
 */

// 9u/10u: no rank column. Columns are team, record, rating, agd, schedule.
const SQUIRT_TABLE = `
<table>
  <tr><th>Team</th><th>Record</th><th>Rating</th><th>AGD</th><th>Sched</th></tr>
  <tr>
    <td><a href="team_info.php?t=111">Boston Jr Bruins</a></td>
    <td>20-4-1</td>
    <td>88.75</td>
    <td>3.10</td>
    <td>81.20</td>
  </tr>
  <tr>
    <td><a href="team_info.php?t=222">Toronto Marlboros</a></td>
    <td>18-6-2</td>
    <td>86.10</td>
    <td>2.45</td>
    <td>80.05</td>
  </tr>
</table>`;

// 11u and up: leading rank column, so everything shifts right by one.
const RANKED_TABLE = `
<table>
  <tr><th>Rank</th><th>Team</th><th>Record</th><th>Rating</th><th>AGD</th><th>Sched</th></tr>
  <tr>
    <td>1</td>
    <td><a href="team_info.php?t=333">Shattuck St Marys</a></td>
    <td>30-2-0</td>
    <td>94.50</td>
    <td>4.80</td>
    <td>85.60</td>
  </tr>
  <tr>
    <td>2</td>
    <td><a href="team_info.php?t=444">Little Caesars</a></td>
    <td>28-5-1</td>
    <td>92.15</td>
    <td>3.90</td>
    <td>84.75</td>
  </tr>
</table>`;

function extract(html: string, omitsRank: boolean) {
  const $ = cheerio.load(html);
  return parse_html($(element1), rankingsExtract(element2, omitsRank)).rankings;
}

describe("rankingsExtract", () => {
  it("reads a 9u/10u table that has no rank column", () => {
    const rows = extract(SQUIRT_TABLE, true);

    expect(rows).toHaveLength(2);
    expect(rows[0].team.selector).toBe("Boston Jr Bruins");
    expect(rows[0].record).toBe("20-4-1");
    expect(rows[0].rating).toBe("88.75");
    expect(rows[0].avg_goal_diff).toBe("3.10");
    expect(rows[0].schedule).toBe("81.20");
    expect(rows[0].link).toBe("team_info.php?t=111");
  });

  it("reads an 11u+ table that has a leading rank column", () => {
    const rows = extract(RANKED_TABLE, false);

    expect(rows).toHaveLength(2);
    expect(rows[0].team.selector).toBe("Shattuck St Marys");
    expect(rows[0].record).toBe("30-2-0");
    expect(rows[0].rating).toBe("94.50");
    expect(rows[0].avg_goal_diff).toBe("4.80");
    expect(rows[0].schedule).toBe("85.60");
    expect(rows[0].link).toBe("team_info.php?t=333");
  });

  it("misreads the columns when the wrong shape is assumed", () => {
    // Guards the omitsRankColumn() wiring: applying the ranked layout to a
    // squirt table shifts the rating into the AGD slot rather than failing.
    const rows = extract(SQUIRT_TABLE, false);
    expect(rows[0].team.selector).not.toBe("Boston Jr Bruins");
    expect(rows[0].rating).not.toBe("88.75");
  });

  it("extracts every data row and skips the header", () => {
    // element2 is "tr:has(td)", so the <th> header row is excluded.
    expect(extract(RANKED_TABLE, false)).toHaveLength(2);
    expect(extract(SQUIRT_TABLE, true)).toHaveLength(2);
  });
});
