INSERT INTO {{toTable}} (id, bound_id, timestamp, value)
(SELECT
    ROW_NUMBER() OVER (ORDER BY bound_id), bound_id, date_trunc('{{granularity}}', timestamp) as period, ROUND(AVG(value)) as value
FROM
     {{fromTable}}
GROUP BY
     period, bound_id
ORDER BY
    bound_id, period
) ON CONFLICT DO NOTHING