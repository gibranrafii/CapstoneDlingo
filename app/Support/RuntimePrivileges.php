<?php

namespace App\Support;

class RuntimePrivileges
{
    public static function allowsOnlyApplicationCrud(string $grant, string $database): bool
    {
        if (str_contains(strtoupper($grant), 'WITH GRANT OPTION') || ! preg_match('/^GRANT (.+) ON (\S+) TO /i', $grant, $parts)) {
            return false;
        }
        $privileges = array_map(fn ($value) => strtoupper(trim($value)), explode(',', $parts[1]));
        $scope = str_replace('`', '', $parts[2]);
        if ($privileges === ['USAGE'] && $scope === '*.*') {
            return true;
        }
        // MariaDB treats unescaped _/% in database grants as wildcards.
        $literalDatabase = strtr($database, ['\\' => '\\\\', '_' => '\\_', '%' => '\\%']);

        return $scope === $literalDatabase.'.*' && ! array_diff($privileges, ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'USAGE']);
    }
}
