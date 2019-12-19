CREATE TEMP TABLE t_unioned AS (
	SELECT pct AS precinct, st_astext(st_union(array_agg(the_geom))) as union_geom from nypd_sectors GROUP BY pct ORDER BY precinct
);