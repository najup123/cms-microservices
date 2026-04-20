package com.pujan.userservice.rbac;

public final class StaticFunction {

    public static final int SELECT = 1;
    public static final int UPDATE = 2;
    public static final int CREATE = 3;
    public static final int DELETE = 4;

    private StaticFunction() {
    }

    public static String getName(int id) {
        return switch (id) {
            case SELECT -> "SELECT";
            case UPDATE -> "UPDATE";
            case CREATE -> "CREATE";
            case DELETE -> "DELETE";
            default -> "UNKNOWN";
        };
    }

    public static int getId(String name) {
        if (name == null) return -1;
        return switch (name.toUpperCase()) {
            case "SELECT" -> SELECT;
            case "UPDATE" -> UPDATE;
            case "CREATE" -> CREATE;
            case "DELETE" -> DELETE;
            default -> -1;
        };
    }
}
