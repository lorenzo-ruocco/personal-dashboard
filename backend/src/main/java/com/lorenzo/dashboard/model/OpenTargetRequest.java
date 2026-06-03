package com.lorenzo.dashboard.model;

public class OpenTargetRequest {

    private String target;

    public OpenTargetRequest() {
        this.target = "";
    }

    public String getTarget() {
        return target == null ? "" : target;
    }

    public void setTarget(String target) {
        this.target = target == null ? "" : target;
    }
}
