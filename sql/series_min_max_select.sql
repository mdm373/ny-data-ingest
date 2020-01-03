INSERT INTO
    series_types (type_name, oldest, newest)
SELECT
   '{{typeName}}' AS type_name, MIN(timestamp) AS oldest, MAX(timestamp) AS newest
FROM
     {{tableName}}
ON CONFLICT (type_name)
    DO UPDATE SET newest = excluded.newest, oldest = excluded.oldest