package com.aglugan.backend.auth.authDTO;

import com.aglugan.backend.entity.Driver;
import com.aglugan.backend.entity.User;
import com.aglugan.backend.auth.authDTO.RegisteredUserDTO;

public class ResultDTO {

    private final GoogleUserDTO googleUser;
    private final String errorMessage;
    private final RegisteredUserDTO registeredUser; // replaces User + Driver fields

    private ResultDTO(GoogleUserDTO googleUser, String errorMessage, RegisteredUserDTO registeredUser) {
        this.googleUser = googleUser;
        this.errorMessage = errorMessage;
        this.registeredUser = registeredUser;
    }

    public static ResultDTO userSuccess(User user) {
        RegisteredUserDTO dto = new RegisteredUserDTO(
                user.getId(), user.getUsername(), user.getName(),
                user.getEmail(), user.getRole(), user.getProfilePicture(), user.getPhoneNumber()
        );
        return new ResultDTO(null, null, dto);
    }

    public static ResultDTO driverUserSuccess(Driver driver) {
        RegisteredUserDTO dto = new RegisteredUserDTO(
                driver.getId(), driver.getUsername(), driver.getName(),
                driver.getEmail(), driver.getRole(), driver.getProfilePicture(), driver.getPhoneNumber()
        );
        return new ResultDTO(null, null, dto);
    }

    public static ResultDTO googleUserSuccess(GoogleUserDTO googleUser) {
        return new ResultDTO(googleUser, null, null);
    }

    public static ResultDTO errorMessage(String errorMessage) {
        return new ResultDTO(null, errorMessage, null);
    }

    public RegisteredUserDTO getRegisteredUser() { return registeredUser; }
    public GoogleUserDTO getGoogleUser() { return googleUser; }
    public String getErrorMessage() { return errorMessage; }

    // keep these if anything else in your codebase uses them
    public boolean isUserSuccess() { return registeredUser != null && "USER".equals(registeredUser.getRole()); }
    public boolean isDriverSuccess() { return registeredUser != null && "DRIVER".equals(registeredUser.getRole()); }
    public boolean isGoogleUserSuccess() { return googleUser != null; }
}
