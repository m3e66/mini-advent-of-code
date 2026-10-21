import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Corrected reference solution. Ages are 0–100; -1 means dead. */
public class Main {
    private static final Pattern RECORD = Pattern.compile("\\s*\\{\\s*\\d{1,9}\\s*:\\s*(.*?)\\s*\\}\\s*");
    private static final String PAIR = "\\(\\s*-?\\d{1,2}\\s*,\\s*-?\\d{1,2}\\s*\\)";
    private static final Pattern COORDINATE = Pattern.compile("\\(\\s*(-?\\d+)\\s*,\\s*(-?\\d+)\\s*\\)");

    public static void main(String[] args) throws Exception {
        Path input = Path.of(args.length == 0 ? "src/data" : args[0]);
        long total = 0;
        for (String line : Files.readAllLines(input)) {
            if (!line.isBlank()) total += energy(parse(line));
        }
        System.out.println(total);
    }

    public static List<int[]> parse(String line) {
        Matcher record = RECORD.matcher(line);
        if (!record.matches()) throw new IllegalArgumentException("Invalid trial: " + line);
        String body = record.group(1);
        List<int[]> coordinates = new ArrayList<>();
        if (body.isEmpty()) return coordinates;
        if (!body.matches(PAIR + "(?:\\s*,\\s*" + PAIR + ")*")) {
            throw new IllegalArgumentException("Invalid coordinate separators");
        }
        Matcher matcher = COORDINATE.matcher(body);
        while (matcher.find()) {
            int x = Integer.parseInt(matcher.group(1));
            int y = Integer.parseInt(matcher.group(2));
            if (Math.abs(x) > 12 || Math.abs(y) > 12) throw new IllegalArgumentException("Coordinate outside powerplant");
            coordinates.add(new int[]{x, y});
        }
        return coordinates;
    }

    private static int[][] empty() {
        int[][] board = new int[25][25];
        for (int[] row : board) Arrays.fill(row, -1);
        return board;
    }

    public static int[][] simulation(int[][] board) {
        int[][] next = empty();
        for (int y = 0; y < 25; y++) for (int x = 0; x < 25; x++) {
            if (x == 12 && y == 12) continue;
            int count = 0, oldest = -1;
            for (int dy = -1; dy <= 1; dy++) for (int dx = -1; dx <= 1; dx++) {
                int nx = x + dx, ny = y + dy;
                if ((dx == 0 && dy == 0) || nx < 0 || nx >= 25 || ny < 0 || ny >= 25 || (nx == 12 && ny == 12)) continue;
                if (board[ny][nx] >= 0) {
                    count++;
                    oldest = Math.max(oldest, board[ny][nx]);
                }
            }
            if (board[y][x] >= 0 && (count == 2 || count == 3)) next[y][x] = Math.min(100, board[y][x] + 1);
            else if (board[y][x] < 0 && count == 3) next[y][x] = Math.min(100, oldest + 1);
        }
        return next;
    }

    private static String occupancy(int[][] board) {
        StringBuilder key = new StringBuilder(625);
        for (int[] row : board) for (int age : row) key.append(age < 0 ? '.' : '#');
        return key.toString();
    }

    public static long energy(List<int[]> coordinates) {
        int[][] board = empty();
        for (int[] coordinate : coordinates) {
            int x = coordinate[0], y = coordinate[1];
            if (Math.abs(x) <= 1 && Math.abs(y) <= 1) continue;
            board[y + 12][x + 12] = 0;
        }
        Set<String> seen = new HashSet<>();
        String pattern = occupancy(board);
        if (pattern.indexOf('#') < 0) return 0;
        seen.add(pattern);
        while (true) {
            board = simulation(board);
            boolean reached = false;
            int ageSum = 0;
            for (int y = 11; y <= 13; y++) for (int x = 11; x <= 13; x++) {
                if (x == 12 && y == 12) continue;
                if (board[y][x] >= 0) { reached = true; ageSum += board[y][x]; }
            }
            if (reached) return ageSum * 600L;
            pattern = occupancy(board);
            if (pattern.indexOf('#') < 0 || !seen.add(pattern)) return 0;
        }
    }
}
